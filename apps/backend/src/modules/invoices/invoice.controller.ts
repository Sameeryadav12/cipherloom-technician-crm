import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { ok, paginated } from "../../utils/api-response.js";
import type { ListInvoicesQuery, UpdateInvoiceBody } from "./invoice.schemas.js";
import type { InvoiceAuthContext } from "./invoice.types.js";
import * as invoiceService from "./invoice.service.js";

function invoiceAuth(req: Request): InvoiceAuthContext {
  if (!req.user) {
    throw new AppError({
      statusCode: 401,
      message: "Unauthorized"
    });
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function listInvoices(req: Request, res: Response) {
  const query = req.query as unknown as ListInvoicesQuery;
  const data = await invoiceService.listInvoices(query, invoiceAuth(req));
  return paginated(res, data);
}

export async function getInvoiceById(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const invoice = await invoiceService.getInvoiceById(id, invoiceAuth(req));
  return ok(res, { invoice });
}

export async function updateInvoice(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as UpdateInvoiceBody;
  const invoice = await invoiceService.updateInvoice(id, body, invoiceAuth(req));
  return ok(res, { invoice }, { message: "Invoice updated" });
}

export async function deleteInvoice(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  await invoiceService.deleteInvoice(id, invoiceAuth(req));
  return ok(res, { deleted: true }, { message: "Invoice deleted" });
}
