import { JobStatus } from "@prisma/client";
import { z } from "zod";

const MAX_DESC = 10_000;
const MAX_NOTES = 5000;
const MAX_ADDR = 255;

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

const optionalId = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());

export const createJobBodySchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    customerId: z.string().trim().min(1),
    technicianId: optionalId,
    description: optionalTrimmed(MAX_DESC),
    scheduledStart: z.coerce.date().optional(),
    scheduledEnd: z.coerce.date().optional(),
    pricingRuleId: optionalId
  })
  .strict()
  .refine(
    (d) => {
      if (d.scheduledStart !== undefined && d.scheduledEnd !== undefined) {
        return d.scheduledEnd > d.scheduledStart;
      }
      return true;
    },
    { message: "scheduledEnd must be later than scheduledStart", path: ["scheduledEnd"] }
  );

export const updateJobBodySchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    customerId: z.string().trim().min(1).optional(),
    technicianId: z
      .preprocess((v) => (v === null ? null : emptyToUndefined(v)), z.union([z.string().trim().min(1), z.null()]).optional()),
    description: optionalTrimmed(MAX_DESC),
    scheduledStart: z.coerce.date().nullish(),
    scheduledEnd: z.coerce.date().nullish(),
    pricingRuleId: z
      .preprocess((v) => (v === null ? null : emptyToUndefined(v)), z.union([z.string().trim().min(1), z.null()]).optional()),
    internalNotes: optionalTrimmed(MAX_NOTES),
    customerNotes: optionalTrimmed(MAX_NOTES),
    serviceAddressLine1: optionalTrimmed(MAX_ADDR),
    serviceAddressLine2: optionalTrimmed(MAX_ADDR),
    serviceSuburb: optionalTrimmed(120),
    serviceState: optionalTrimmed(120),
    servicePostcode: optionalTrimmed(32),
    serviceCountry: optionalTrimmed(120)
  })
  .strict()
  .refine(
    (data) => Object.entries(data).some(([, v]) => v !== undefined),
    { message: "At least one field is required" }
  )
  .superRefine((data, ctx) => {
    if (
      data.scheduledStart !== undefined &&
      data.scheduledStart !== null &&
      data.scheduledEnd !== undefined &&
      data.scheduledEnd !== null &&
      data.scheduledEnd <= data.scheduledStart
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "scheduledEnd must be later than scheduledStart",
        path: ["scheduledEnd"]
      });
    }
  });

export const jobIdParamSchema = z.object({
  id: z.string().trim().min(1, "Job id is required")
});

const jobStatusQuery = z.preprocess(emptyToUndefined, z.nativeEnum(JobStatus).optional());

const optionalQueryDate = z.preprocess((value) => {
  const v = emptyToUndefined(value);
  if (v === undefined) return undefined;
  return v instanceof Date ? v : new Date(String(v));
}, z.date().optional());

export const listJobsQuerySchema = z
  .object({
    status: jobStatusQuery,
    technicianId: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
    customerId: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
    scheduledStartFrom: optionalQueryDate,
    scheduledStartTo: optionalQueryDate,
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
      q.scheduledStartFrom === undefined ||
      !Number.isNaN(q.scheduledStartFrom.getTime()),
    { message: "Invalid scheduledStartFrom", path: ["scheduledStartFrom"] }
  )
  .refine(
    (q) =>
      q.scheduledStartTo === undefined ||
      !Number.isNaN(q.scheduledStartTo.getTime()),
    { message: "Invalid scheduledStartTo", path: ["scheduledStartTo"] }
  )
  .refine(
    (q) => {
      if (
        q.scheduledStartFrom &&
        q.scheduledStartTo &&
        q.scheduledStartTo < q.scheduledStartFrom
      ) {
        return false;
      }
      return true;
    },
    {
      message: "scheduledStartTo must be on or after scheduledStartFrom",
      path: ["scheduledStartTo"]
    }
  );

export const assignTechnicianBodySchema = z
  .object({
    technicianId: z.string().trim().min(1, "technicianId is required")
  })
  .strict();

export const updateJobStatusBodySchema = z
  .object({
    status: z.nativeEnum(JobStatus)
  })
  .strict();

export type CreateJobBody = z.infer<typeof createJobBodySchema>;
export type UpdateJobBody = z.infer<typeof updateJobBodySchema>;
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
export type AssignTechnicianBody = z.infer<typeof assignTechnicianBodySchema>;
export type UpdateJobStatusBody = z.infer<typeof updateJobStatusBodySchema>;
