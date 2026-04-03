import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const booleanQuery = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return value;
}, z.boolean().optional());

const requiredDate = z.coerce.date();

export const getCalendarQuerySchema = z
  .object({
    start: requiredDate,
    end: requiredDate,
    technicianId: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).optional()
    ),
    includeJobs: booleanQuery.default(true),
    includeTimeOff: booleanQuery.default(true)
  })
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
  })
  .refine((q) => q.includeJobs || q.includeTimeOff, {
    message: "At least one of includeJobs/includeTimeOff must be true",
    path: ["includeJobs"]
  });

export const checkConflictsBodySchema = z
  .object({
    technicianId: z.string().trim().min(1, "technicianId is required"),
    start: requiredDate,
    end: requiredDate,
    ignoreJobId: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).optional()
    ),
    ignoreTimeOffId: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).optional()
    )
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

export type GetCalendarQuery = z.infer<typeof getCalendarQuerySchema>;
export type CheckConflictsBody = z.infer<typeof checkConflictsBodySchema>;

