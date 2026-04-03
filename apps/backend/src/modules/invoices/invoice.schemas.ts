import { InvoiceStatus } from "@prisma/client";
import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalNotes = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}, z.string().trim().max(5000).optional());

export const generateInvoiceBodySchema = z
  .object({
    serviceAddonIds: z.array(z.string().trim().min(1)).optional()
  })
  .strict();

const discountField = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0, "discount must be at least 0").optional()
);

const dueAtField = z.coerce.date().optional();

export const updateInvoiceBodySchema = z
  .object({
    status: z.nativeEnum(InvoiceStatus).optional(),
    discount: discountField,
    notes: optionalNotes,
    dueAt: dueAtField
  })
  .strict()
  .refine(
    (data) => Object.entries(data).some(([, v]) => v !== undefined),
    { message: "At least one field is required" }
  )
  .superRefine((data, ctx) => {
    if (data.dueAt !== undefined && data.dueAt.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dueAt must be a future date",
        path: ["dueAt"]
      });
    }
  });

export const invoiceIdParamSchema = z.object({
  id: z.string().trim().min(1, "Invoice id is required")
});

const invoiceStatusQuery = z.preprocess(
  emptyToUndefined,
  z.nativeEnum(InvoiceStatus).optional()
);

const optionalQueryDate = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (v === undefined) return undefined;
  return v instanceof Date ? v : new Date(String(v));
}, z.date().optional());

export const listInvoicesQuerySchema = z
  .object({
    status: invoiceStatusQuery,
    customerId: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
    issuedAtFrom: optionalQueryDate,
    issuedAtTo: optionalQueryDate,
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100, "limit must be at most 100")
      .default(20)
  })
  .refine(
    (q) =>
      q.issuedAtFrom === undefined || !Number.isNaN(q.issuedAtFrom.getTime()),
    { message: "Invalid issuedAtFrom", path: ["issuedAtFrom"] }
  )
  .refine(
    (q) => q.issuedAtTo === undefined || !Number.isNaN(q.issuedAtTo.getTime()),
    { message: "Invalid issuedAtTo", path: ["issuedAtTo"] }
  )
  .refine(
    (q) => {
      if (q.issuedAtFrom && q.issuedAtTo && q.issuedAtTo < q.issuedAtFrom) {
        return false;
      }
      return true;
    },
    { message: "issuedAtTo must be on or after issuedAtFrom", path: ["issuedAtTo"] }
  );

export type GenerateInvoiceBody = z.infer<typeof generateInvoiceBodySchema>;
export type UpdateInvoiceBody = z.infer<typeof updateInvoiceBodySchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
