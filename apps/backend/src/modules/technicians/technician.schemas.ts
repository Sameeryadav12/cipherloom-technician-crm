import { z } from "zod";

const MAX_PHONE_LEN = 32;
const MAX_SKILLS = 50;
const MAX_SKILL_ITEM_LEN = 64;

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalEmail = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (typeof v === "string" && v.trim() === "") return undefined;
  return typeof v === "string" ? v.trim() : v;
}, z.union([z.undefined(), z.string().email("Invalid email format").toLowerCase()]));

const optionalTrimmedPhone = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}, z.string().trim().max(MAX_PHONE_LEN).optional());

/** Calendar lane color: #RRGGBB */
const optionalHexColor = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (typeof v === "string" && v.trim() === "") return undefined;
  return typeof v === "string" ? v.trim() : v;
}, z.union([z.undefined(), z.string().regex(/^#[0-9A-Fa-f]{6}$/, "color must be a hex value like #RRGGBB")]));

const optionalSkills = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return value;
  return value
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item: string) => item.trim());
}, z.array(z.string().min(1).max(MAX_SKILL_ITEM_LEN)).max(MAX_SKILLS).optional());

const optionalLinkedUserId = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());

/** Update only: omit field to leave unchanged; `null` unlinks the user. */
const updateLinkedUserId = z.preprocess((value) => {
  if (value === null) return null;
  return emptyToUndefined(value);
}, z.union([z.undefined(), z.null(), z.string().trim().min(1)]));

export const createTechnicianBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must be at most 120 characters"),
    email: optionalEmail,
    phone: optionalTrimmedPhone,
    skills: optionalSkills,
    color: optionalHexColor,
    isActive: z.boolean().optional(),
    linkedUserId: optionalLinkedUserId
  })
  .strict();

export const updateTechnicianBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must be at most 120 characters")
      .optional(),
    email: optionalEmail,
    phone: optionalTrimmedPhone,
    skills: optionalSkills,
    color: optionalHexColor,
    isActive: z.boolean().optional(),
    linkedUserId: updateLinkedUserId
  })
  .strict()
  .refine(
    (data) => Object.entries(data).some(([, value]) => value !== undefined),
    { message: "At least one field is required" }
  );

export const technicianIdParamSchema = z.object({
  id: z.string().trim().min(1, "Technician id is required")
});

const optionalBooleanQuery = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return value;
}, z.boolean().optional());

export const listTechniciansQuerySchema = z.object({
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
    .default(20),
  isActive: optionalBooleanQuery
});

export type CreateTechnicianBody = z.infer<typeof createTechnicianBodySchema>;
export type UpdateTechnicianBody = z.infer<typeof updateTechnicianBodySchema>;
export type ListTechniciansQuery = z.infer<typeof listTechniciansQuerySchema>;
