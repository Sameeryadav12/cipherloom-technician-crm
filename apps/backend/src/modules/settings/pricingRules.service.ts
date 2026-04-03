import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type {
  CreatePricingRuleBody,
  ListPricingRulesQuery,
  UpdatePricingRuleBody
} from "./pricingRules.schemas.js";
import type { PricingRulePublic } from "./pricingRules.types.js";

async function requirePricingRule(id: string) {
  const row = await prisma.pricingRule.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!row) {
    throw new AppError({
      statusCode: 404,
      message: "Pricing rule not found"
    });
  }
}

export async function listPricingRules(
  query: ListPricingRulesQuery
): Promise<{
  items: PricingRulePublic[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}> {
  const { page, limit, search, isActive, isDefault } = query;

  const parts: Prisma.PricingRuleWhereInput[] = [];
  if (search && search.trim().length > 0) {
    const q = search.trim();
    parts.push({
      name: { contains: q, mode: "insensitive" }
    });
  }
  if (typeof isActive === "boolean") parts.push({ isActive });
  if (typeof isDefault === "boolean") parts.push({ isDefault });

  const where: Prisma.PricingRuleWhereInput =
    parts.length === 0 ? {} : { AND: parts };
  const skip = (page - 1) * limit;

  const [items, totalItems] = await prisma.$transaction([
    prisma.pricingRule.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isDefault: "desc" }, { isActive: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { serviceAddons: true } }
      }
    }),
    prisma.pricingRule.count({ where })
  ]);

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return { items, page, pageSize: limit, totalItems, totalPages };
}

export async function getPricingRuleById(id: string): Promise<PricingRulePublic> {
  const row = await prisma.pricingRule.findUnique({
    where: { id },
    include: {
      serviceAddons: {
        orderBy: { name: "asc" }
      },
      _count: { select: { serviceAddons: true } }
    }
  });
  if (!row) {
    throw new AppError({
      statusCode: 404,
      message: "Pricing rule not found"
    });
  }
  return row;
}

export async function createPricingRule(
  input: CreatePricingRuleBody
): Promise<PricingRulePublic> {
  const data: Prisma.PricingRuleCreateInput = {
    name: input.name,
    description: input.description,
    baseCalloutFee: new Prisma.Decimal(input.baseCalloutFee),
    blockMinutes: input.blockMinutes,
    blockRate: new Prisma.Decimal(input.blockRate),
    isDefault: input.isDefault ?? false,
    isActive: input.isActive ?? true
  };

  const result = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.pricingRule.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    return tx.pricingRule.create({
      data,
      include: { _count: { select: { serviceAddons: true } } }
    });
  });

  return result;
}

export async function updatePricingRule(
  id: string,
  input: UpdatePricingRuleBody
): Promise<PricingRulePublic> {
  await requirePricingRule(id);

  const data: Prisma.PricingRuleUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.baseCalloutFee !== undefined) {
    data.baseCalloutFee = new Prisma.Decimal(input.baseCalloutFee);
  }
  if (input.blockMinutes !== undefined) data.blockMinutes = input.blockMinutes;
  if (input.blockRate !== undefined) {
    data.blockRate = new Prisma.Decimal(input.blockRate);
  }
  if (input.isDefault !== undefined) data.isDefault = input.isDefault;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const updated = await prisma.$transaction(async (tx) => {
    if (input.isDefault === true) {
      await tx.pricingRule.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false }
      });
    }
    return tx.pricingRule.update({
      where: { id },
      data,
      include: { _count: { select: { serviceAddons: true } } }
    });
  });

  return updated;
}

export async function deletePricingRule(id: string): Promise<void> {
  await requirePricingRule(id);

  const [jobsCount, invoicesCount] = await Promise.all([
    prisma.job.count({ where: { pricingRuleId: id } }),
    prisma.invoice.count({ where: { pricingRuleId: id } })
  ]);

  if (jobsCount > 0 || invoicesCount > 0) {
    throw new AppError({
      statusCode: 409,
      message:
        "Pricing rule cannot be deleted because it is used by jobs or invoices."
    });
  }

  await prisma.pricingRule.delete({ where: { id } });
}

