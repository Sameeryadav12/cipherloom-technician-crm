import { z } from "zod";

const MAX_REASON_LEN = 2000;

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalReason = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}, z.string().trim().max(MAX_REASON_LEN).optional());

export const createTimeOffBodySchema = z
  .object({
    technicianId: z.string().trim().min(1, "technicianId is required"),
    start: z.coerce.date(),
    end: z.coerce.date(),
    reason: optionalReason
  })
  .strict()
  .refine((data) => data.end > data.start, {
    message: "end must be later than start",
    path: ["end"]
  });

export const updateTimeOffBodySchema = z
  .object({
    technicianId: z.string().trim().min(1).optional(),
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    reason: optionalReason
  })
  .strict()
  .refine(
    (data) => Object.entries(data).some(([, value]) => value !== undefined),
    { message: "At least one field is required" }
  )
  .refine(
    (data) => {
      if (data.start !== undefined && data.end !== undefined) {
        return data.end > data.start;
      }
      return true;
    },
    { message: "end must be later than start", path: ["end"] }
  );

export const timeOffIdParamSchema = z.object({
  id: z.string().trim().min(1, "Time-off id is required")
});

const optionalQueryDate = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (v === undefined) return undefined;
  return v instanceof Date ? v : new Date(String(v));
}, z.date().optional());

export const listTimeOffQuerySchema = z
  .object({
    technicianId: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
    start: optionalQueryDate,
    end: optionalQueryDate,
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100, "limit must be at most 100")
      .default(20)
  })
  .refine(
    (q) => q.start === undefined || !Number.isNaN(q.start.getTime()),
    { message: "Invalid start date", path: ["start"] }
  )
  .refine(
    (q) => q.end === undefined || !Number.isNaN(q.end.getTime()),
    { message: "Invalid end date", path: ["end"] }
  );

export type CreateTimeOffBody = z.infer<typeof createTimeOffBodySchema>;
export type UpdateTimeOffBody = z.infer<typeof updateTimeOffBodySchema>;
export type ListTimeOffQuery = z.infer<typeof listTimeOffQuerySchema>;
