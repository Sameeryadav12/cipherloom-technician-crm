import { RecurrencePattern } from "@prisma/client";
import { z } from "zod";

const optionalId = z.preprocess(
  (v) => (v === undefined || v === null || v === "" ? undefined : v),
  z.string().trim().min(1).optional()
);

export const recurringJobIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

const recurringJobTemplateBodySchema = z
  .object({
    customerId: z.string().trim().min(1),
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().max(2000).optional(),
    technicianId: optionalId,
    durationMinutes: z.number().int().min(15).max(480).default(60),
    recurrencePattern: z.nativeEnum(RecurrencePattern),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().default(true)
  })
  .strict();

export const createRecurringJobTemplateBodySchema = recurringJobTemplateBodySchema
  .refine((b) => !b.endDate || b.endDate >= b.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"]
  });

export const updateRecurringJobTemplateBodySchema = recurringJobTemplateBodySchema
  .partial()
  .refine((b) => Object.keys(b).length > 0, {
    message: "At least one field is required"
  })
  .refine((b) => !b.endDate || !b.startDate || b.endDate >= b.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"]
  });

export type CreateRecurringJobTemplateBody = z.infer<typeof createRecurringJobTemplateBodySchema>;
export type UpdateRecurringJobTemplateBody = z.infer<typeof updateRecurringJobTemplateBodySchema>;
