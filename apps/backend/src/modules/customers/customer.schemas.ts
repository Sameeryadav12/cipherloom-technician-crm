import { z } from "zod";

const MAX_PHONE_LEN = 32;
const MAX_ADDRESS_LEN = 255;
const MAX_NOTES_LEN = 5000;

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalTrimmedString = (max: number) =>
  z.preprocess((value) => {
    const v = emptyToUndefined(value);
    if (typeof v === "string" && v.trim() === "") return undefined;
    return v;
  }, z.string().trim().max(max, `Must be at most ${max} characters`).optional());

const optionalEmail = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (typeof v === "string" && v.trim() === "") return undefined;
  return typeof v === "string" ? v.trim() : v;
}, z.union([z.undefined(), z.string().email("Invalid email format").toLowerCase()]));

export const createCustomerBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must be at most 120 characters"),
    email: optionalEmail,
    phone: optionalTrimmedString(MAX_PHONE_LEN),
    addressLine1: optionalTrimmedString(MAX_ADDRESS_LEN),
    addressLine2: optionalTrimmedString(MAX_ADDRESS_LEN),
    suburb: optionalTrimmedString(120),
    state: optionalTrimmedString(120),
    postcode: optionalTrimmedString(32),
    country: optionalTrimmedString(120),
    notes: optionalTrimmedString(MAX_NOTES_LEN)
  })
  .strict();

export const updateCustomerBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must be at most 120 characters")
      .optional(),
    email: optionalEmail,
    phone: optionalTrimmedString(MAX_PHONE_LEN),
    addressLine1: optionalTrimmedString(MAX_ADDRESS_LEN),
    addressLine2: optionalTrimmedString(MAX_ADDRESS_LEN),
    suburb: optionalTrimmedString(120),
    state: optionalTrimmedString(120),
    postcode: optionalTrimmedString(32),
    country: optionalTrimmedString(120),
    notes: optionalTrimmedString(MAX_NOTES_LEN)
  })
  .strict()
  .refine(
    (data) =>
      Object.entries(data).some(([, value]) => value !== undefined),
    { message: "At least one field is required" }
  );

export const customerIdParamSchema = z.object({
  id: z.string().trim().min(1, "Customer id is required")
});

export const listCustomersQuerySchema = z.object({
  search: z.preprocess((value) => {
    const v = emptyToUndefined(value);
    if (typeof v === "string" && v.trim() === "") return undefined;
    return v;
  }, z.string().trim().optional()),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100, "limit must be at most 100")
    .default(20)
});

export type CreateCustomerBody = z.infer<typeof createCustomerBodySchema>;
export type UpdateCustomerBody = z.infer<typeof updateCustomerBodySchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
