import { z } from "zod";

export const runAutomationBodySchema = z
  .object({
    taskKey: z
      .enum([
        "recurring_jobs",
        "invoice_reminders",
        "stale_jobs",
        "dispatch_attention",
        "auto_assignment_suggestions"
      ])
      .optional()
  })
  .strict();

export const automationRuleIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const updateAutomationRuleBodySchema = z
  .object({
    isEnabled: z.boolean().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    nextRunAt: z.coerce.date().optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

export type RunAutomationBody = z.infer<typeof runAutomationBodySchema>;
export type UpdateAutomationRuleBody = z.infer<typeof updateAutomationRuleBodySchema>;
