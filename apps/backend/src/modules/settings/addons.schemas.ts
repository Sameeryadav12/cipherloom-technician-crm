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

export const pricingRuleIdParamSchemaForAddons = z.object({
  id: z.string().trim().min(1, "Pricing rule id is required")
});

export const addonIdParamSchema = z.object({
  addonId: z.string().trim().min(1, "Addon id is required")
});

export const listAddonsQuerySchema = z.object({
  isActive: optionalBooleanQuery
});

export const createAddonBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: optionalTrimmed(5000),
    price: z.coerce.number().min(0),
    isActive: z.boolean().optional()
  })
  .strict();

export const updateAddonBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: optionalTrimmed(5000),
    price: z.coerce.number().min(0).optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine(
    (data) => Object.entries(data).some(([, value]) => value !== undefined),
    { message: "At least one field is required" }
  );

export type ListAddonsQuery = z.infer<typeof listAddonsQuerySchema>;
export type CreateAddonBody = z.infer<typeof createAddonBodySchema>;
export type UpdateAddonBody = z.infer<typeof updateAddonBodySchema>;

