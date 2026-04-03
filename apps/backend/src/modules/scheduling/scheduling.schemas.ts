import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalId = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional()
);

const optionalDate = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (v === undefined) return undefined;
  return v instanceof Date ? v : new Date(String(v));
}, z.date().optional());

export const suggestScheduleBodySchema = z
  .object({
    customerId: z.string().trim().min(1, "customerId is required"),
    title: z.string().trim().min(3).max(150),
    durationMinutes: z.number().int().min(15).max(1440),
    preferredStart: optionalDate,
    preferredEnd: optionalDate,
    technicianId: optionalId,
    requiredSkills: z
      .array(z.string().trim().min(1))
      .max(50)
      .optional(),
    serviceAddress: z
      .object({
        suburb: z.preprocess(
          emptyToUndefined,
          z.string().trim().max(120).optional()
        ),
        state: z.preprocess(
          emptyToUndefined,
          z.string().trim().max(120).optional()
        ),
        postcode: z.preprocess(
          emptyToUndefined,
          z.string().trim().max(32).optional()
        )
      })
      .strict()
      .optional(),
    ignoreJobId: optionalId
  })
  .strict()
  .refine(
    (b) =>
      b.preferredStart === undefined
        ? true
        : !Number.isNaN(b.preferredStart.getTime()),
    { message: "Invalid preferredStart", path: ["preferredStart"] }
  )
  .refine(
    (b) =>
      b.preferredEnd === undefined ? true : !Number.isNaN(b.preferredEnd.getTime()),
    { message: "Invalid preferredEnd", path: ["preferredEnd"] }
  )
  .refine(
    (b) =>
      (b.preferredStart === undefined && b.preferredEnd === undefined) ||
      (b.preferredStart !== undefined && b.preferredEnd !== undefined),
    {
      message: "preferredStart and preferredEnd must be provided together",
      path: ["preferredStart"]
    }
  )
  .refine(
    (b) =>
      b.preferredStart && b.preferredEnd ? b.preferredEnd > b.preferredStart : true,
    { message: "preferredEnd must be later than preferredStart", path: ["preferredEnd"] }
  );

export type SuggestScheduleBody = z.infer<typeof suggestScheduleBodySchema>;

export const checkSchedulingConflictBodySchema = z
  .object({
    technicianId: z.string().trim().min(1, "technicianId is required"),
    start: z.coerce.date(),
    end: z.coerce.date(),
    ignoreJobId: optionalId
  })
  .strict()
  .refine((b) => !Number.isNaN(b.start.getTime()), {
    message: "Invalid start date",
    path: ["start"]
  })
  .refine((b) => !Number.isNaN(b.end.getTime()), {
    message: "Invalid end date",
    path: ["end"]
  })
  .refine((b) => b.end > b.start, {
    message: "end must be later than start",
    path: ["end"]
  });

export const technicianAvailabilityQuerySchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date()
  })
  .strict()
  .refine((q) => !Number.isNaN(q.start.getTime()), {
    message: "Invalid start date",
    path: ["start"]
  })
  .refine((q) => !Number.isNaN(q.end.getTime()), {
    message: "Invalid end date",
    path: ["end"]
  })
  .refine((q) => q.end > q.start, {
    message: "end must be later than start",
    path: ["end"]
  });

export type CheckSchedulingConflictBody = z.infer<typeof checkSchedulingConflictBodySchema>;
export type TechnicianAvailabilityQuery = z.infer<typeof technicianAvailabilityQuerySchema>;

