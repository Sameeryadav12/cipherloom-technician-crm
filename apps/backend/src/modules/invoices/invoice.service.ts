import {
  InvoiceStatus,
  JobStatus,
  Prisma,
  UserRole
} from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { logger } from "../../utils/logger.js";
import { calculateInvoiceAmounts } from "./invoice.pricing.js";
import * as notificationService from "../notifications/notification.service.js";
import type {
  GenerateInvoiceBody,
  ListInvoicesQuery,
  UpdateInvoiceBody
} from "./invoice.schemas.js";
import type { InvoiceAuthContext } from "./invoice.types.js";

const listInclude = {
  job: {
    select: {
      id: true,
      title: true,
      customer: { select: { id: true, name: true } }
    }
  }
} satisfies Prisma.InvoiceInclude;

async function getTechnicianIdForUser(userId: string): Promise<string | null> {
  const row = await prisma.technician.findFirst({
    where: { linkedUserId: userId },
    select: { id: true }
  });
  return row?.id ?? null;
}

function assertTechnicianOwnsInvoiceJob(
  job: { technicianId: string | null },
  techId: string | null,
  role: UserRole
) {
  if (role !== UserRole.TECHNICIAN) return;
  if (!techId || job.technicianId !== techId) {
    throw new AppError({
      statusCode: 403,
      message: "You do not have access to this invoice"
    });
  }
}

function assertInvoiceStatusTransition(from: InvoiceStatus, to: InvoiceStatus) {
  if (from === to) return;
  if (to === InvoiceStatus.VOID) return;
  if (from === InvoiceStatus.VOID) {
    throw new AppError({
      statusCode: 400,
      message: "Cannot change a voided invoice"
    });
  }
  const allowed: Record<InvoiceStatus, InvoiceStatus[]> = {
    [InvoiceStatus.DRAFT]: [InvoiceStatus.SENT],
    [InvoiceStatus.SENT]: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE],
    [InvoiceStatus.PAID]: [],
    [InvoiceStatus.OVERDUE]: [InvoiceStatus.PAID],
    [InvoiceStatus.VOID]: []
  };
  if (!allowed[from].includes(to)) {
    throw new AppError({
      statusCode: 400,
      message: `Invalid invoice status transition from ${from} to ${to}`
    });
  }
}

async function resolvePricingRuleForJob(job: {
  pricingRuleId: string | null;
}): Promise<{
  id: string;
  baseCalloutFee: Prisma.Decimal;
  blockMinutes: number;
  blockRate: Prisma.Decimal;
}> {
  if (job.pricingRuleId) {
    const rule = await prisma.pricingRule.findFirst({
      where: { id: job.pricingRuleId, isActive: true },
      select: {
        id: true,
        baseCalloutFee: true,
        blockMinutes: true,
        blockRate: true
      }
    });
    if (!rule) {
      throw new AppError({
        statusCode: 400,
        message: "Job pricing rule not found or inactive"
      });
    }
    return rule;
  }

  const def = await prisma.pricingRule.findFirst({
    where: { isDefault: true, isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      baseCalloutFee: true,
      blockMinutes: true,
      blockRate: true
    }
  });
  if (!def) {
    throw new AppError({
      statusCode: 400,
      message: "No active default pricing rule is configured"
    });
  }
  return def;
}

export async function listInvoices(
  query: ListInvoicesQuery,
  auth: InvoiceAuthContext
): Promise<{
  items: unknown[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}> {
  const { page, limit } = query;
  const parts: Prisma.InvoiceWhereInput[] = [];

  if (auth.role === UserRole.TECHNICIAN) {
    const techId = await getTechnicianIdForUser(auth.userId);
    if (!techId) {
      return {
        items: [],
        page,
        pageSize: limit,
        totalItems: 0,
        totalPages: 0
      };
    }
    parts.push({ job: { technicianId: techId } });
  }

  if (query.status) parts.push({ status: query.status });
  if (query.customerId) {
    parts.push({ job: { customerId: query.customerId } });
  }
  if (query.issuedAtFrom || query.issuedAtTo) {
    const range: Prisma.DateTimeFilter = {};
    if (query.issuedAtFrom) range.gte = query.issuedAtFrom;
    if (query.issuedAtTo) range.lte = query.issuedAtTo;
    parts.push({ issuedAt: range });
  }

  const where: Prisma.InvoiceWhereInput =
    parts.length === 0 ? {} : { AND: parts };

  const skip = (page - 1) * limit;

  const [rows, totalItems] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: listInclude
    }),
    prisma.invoice.count({ where })
  ]);

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return {
    items: rows,
    page,
    pageSize: limit,
    totalItems,
    totalPages
  };
}

export async function getInvoiceById(id: string, auth: InvoiceAuthContext) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          technicianId: true,
          customer: { select: { id: true, name: true } }
        }
      },
      pricingRule: {
        select: { id: true, name: true }
      }
    }
  });

  if (!invoice) {
    throw new AppError({
      statusCode: 404,
      message: "Invoice not found"
    });
  }

  const techId =
    auth.role === UserRole.TECHNICIAN
      ? await getTechnicianIdForUser(auth.userId)
      : null;
  assertTechnicianOwnsInvoiceJob(invoice.job, techId, auth.role);

  return invoice;
}

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceBody,
  auth: InvoiceAuthContext
) {
  if (auth.role === UserRole.TECHNICIAN) {
    throw new AppError({
      statusCode: 403,
      message: "Forbidden"
    });
  }

  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      subtotal: true,
      tax: true,
      discount: true
    }
  });
  if (!existing) {
    throw new AppError({
      statusCode: 404,
      message: "Invoice not found"
    });
  }

  const data: Prisma.InvoiceUpdateInput = {};

  if (input.status !== undefined) {
    assertInvoiceStatusTransition(existing.status, input.status);
    data.status = input.status;
    if (input.status === InvoiceStatus.PAID) {
      data.paidAt = new Date();
    }
  }
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.dueAt !== undefined) data.dueAt = input.dueAt;

  if (input.discount !== undefined) {
    const discountDec = new Prisma.Decimal(input.discount).toDecimalPlaces(2);
    let total = existing.subtotal.add(existing.tax).sub(discountDec);
    if (total.lessThan(0)) {
      total = new Prisma.Decimal(0);
    }
    total = total.toDecimalPlaces(2);
    data.discount = discountDec;
    data.total = total;
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data,
    include: listInclude
  });

  if (input.status === InvoiceStatus.SENT) {
    try {
      await notificationService.notifyDispatchAlert({
        type: "INVOICE_DUE",
        title: "Invoice issued",
        message: `Invoice for ${updated.job?.title ?? "job"} is now due.`,
        payload: { invoiceId: updated.id, jobId: updated.jobId }
      });
    } catch (error) {
      logger.warn("Failed to send invoice due notification", {
        invoiceId: updated.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  if (input.status === InvoiceStatus.OVERDUE) {
    try {
      await notificationService.notifyDispatchAlert({
        type: "INVOICE_OVERDUE",
        title: "Invoice overdue",
        message: `Invoice for ${updated.job?.title ?? "job"} is overdue.`,
        payload: { invoiceId: updated.id, jobId: updated.jobId }
      });
    } catch (error) {
      logger.warn("Failed to send invoice overdue notification", {
        invoiceId: updated.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return updated;
}

export async function deleteInvoice(id: string, auth: InvoiceAuthContext) {
  if (auth.role === UserRole.TECHNICIAN) {
    throw new AppError({
      statusCode: 403,
      message: "Forbidden"
    });
  }

  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, status: true }
  });
  if (!existing) {
    throw new AppError({
      statusCode: 404,
      message: "Invoice not found"
    });
  }
  if (existing.status === InvoiceStatus.PAID) {
    throw new AppError({
      statusCode: 409,
      message: "Cannot delete an invoice that has been paid"
    });
  }
  await prisma.invoice.delete({ where: { id } });
}

export async function generateInvoiceFromJob(
  jobId: string,
  body: GenerateInvoiceBody,
  auth: InvoiceAuthContext
) {
  if (auth.role === UserRole.TECHNICIAN) {
    throw new AppError({
      statusCode: 403,
      message: "Forbidden"
    });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      invoice: { select: { id: true } }
    }
  });

  if (!job) {
    throw new AppError({
      statusCode: 404,
      message: "Job not found"
    });
  }

  if (job.status !== JobStatus.COMPLETED) {
    throw new AppError({
      statusCode: 400,
      message: "Invoice can only be generated for a completed job"
    });
  }

  if (job.invoice) {
    throw new AppError({
      statusCode: 409,
      message: "This job already has an invoice"
    });
  }

  const rule = await resolvePricingRuleForJob(job);

  let addons: { price: Prisma.Decimal }[] = [];
  if (body.serviceAddonIds && body.serviceAddonIds.length > 0) {
    const found = await prisma.serviceAddon.findMany({
      where: {
        id: { in: body.serviceAddonIds },
        pricingRuleId: rule.id,
        isActive: true
      },
      select: { id: true, price: true }
    });
    if (found.length !== body.serviceAddonIds.length) {
      throw new AppError({
        statusCode: 400,
        message:
          "One or more service add-ons are invalid, inactive, or do not belong to the pricing rule"
      });
    }
    addons = found;
  }

  const { subtotal, tax, total } = calculateInvoiceAmounts({
    rule,
    jobScheduledStart: job.scheduledStart,
    jobScheduledEnd: job.scheduledEnd,
    addons,
    taxRatePercent: env.INVOICE_TAX_RATE_PERCENT,
    discount: new Prisma.Decimal(0)
  });

  const issuedAt = new Date();

  const [invoice] = await prisma.$transaction([
    prisma.invoice.create({
      data: {
        jobId: job.id,
        pricingRuleId: rule.id,
        subtotal,
        tax,
        discount: new Prisma.Decimal(0),
        total,
        status: InvoiceStatus.DRAFT,
        issuedAt
      },
      include: listInclude
    }),
    prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.INVOICED }
    })
  ]);

  return invoice;
}
