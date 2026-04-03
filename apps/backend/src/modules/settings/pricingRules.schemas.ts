import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalTrimmed = (max: number) =>
  z.preprocess((value) => {
    const v = emptyToUndefined(value);
    if (typeof v === "string" && v.trim() === "") return undefined;
    return v;
  }, z.string().trim().max(max).optional());

const optionalBooleanQuery = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return value;
}, z.boolean().optional());

const moneyNumber = z.coerce.number().min(0);

export const pricingRuleIdParamSchema = z.object({
  id: z.string().trim().min(1, "Pricing rule id is required")
});

export const listPricingRulesQuerySchema = z.object({
  search: z.preprocess((value) => {
    const v = emptyToUndefined(value);
    if (typeof v === "string" && v.trim() === "") return undefined;
    return v;
  }, z.string().trim().optional()),
  isActive: optionalBooleanQuery,
  isDefault: optionalBooleanQuery,
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100, "limit must be at most 100")
    .default(20)
});

export const createPricingRuleBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: optionalTrimmed(5000),
    baseCalloutFee: moneyNumber,
    blockMinutes: z.coerce.number().int().min(1).max(1440),
    blockRate: moneyNumber,
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export const updatePricingRuleBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: optionalTrimmed(5000),
    baseCalloutFee: moneyNumber.optional(),
    blockMinutes: z.coerce.number().int().min(1).max(1440).optional(),
    blockRate: moneyNumber.optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine(
    (data) => Object.entries(data).some(([, value]) => value !== undefined),
    { message: "At least one field is required" }
  );

export type ListPricingRulesQuery = z.infer<typeof listPricingRulesQuerySchema>;
export type CreatePricingRuleBody = z.infer<typeof createPricingRuleBodySchema>;
export type UpdatePricingRuleBody = z.infer<typeof updatePricingRuleBodySchema>;

