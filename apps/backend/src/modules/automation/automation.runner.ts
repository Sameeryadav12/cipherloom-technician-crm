import { prisma } from "../../config/prisma.js";
import type { AutomationTaskKey, AutomationRunTaskResult } from "./automation.types.js";
import { runAutoAssignmentSuggestionAutomation } from "./jobs/auto-assignment.automation.js";
import { runDispatchAttentionAutomation } from "./jobs/dispatch-alerts.automation.js";
import { runInvoiceRemindersAutomation } from "./jobs/invoice-reminders.automation.js";
import { runRecurringJobsAutomation } from "./jobs/recurring-jobs.automation.js";
import { runStaleJobsAutomation } from "./jobs/stale-jobs.automation.js";

const taskRunners: Record<AutomationTaskKey, () => Promise<{ created: number; skipped: number }>> = {
  recurring_jobs: runRecurringJobsAutomation,
  invoice_reminders: runInvoiceRemindersAutomation,
  stale_jobs: runStaleJobsAutomation,
  dispatch_attention: runDispatchAttentionAutomation,
  auto_assignment_suggestions: runAutoAssignmentSuggestionAutomation
};

export async function runAutomationTasks(taskKey?: AutomationTaskKey) {
  const keys = taskKey ? [taskKey] : (Object.keys(taskRunners) as AutomationTaskKey[]);
  const results: AutomationRunTaskResult[] = [];
  for (const key of keys) {
    const rule = await prisma.automationRule.findUnique({ where: { key } });
    if (rule && !rule.isEnabled) {
      results.push({ taskKey: key, ok: true, skipped: 1, details: { reason: "disabled" } });
      continue;
    }
    const log = await prisma.automationRunLog.create({
      data: {
        ruleId: rule?.id ?? null,
        taskKey: key,
        status: "RUNNING"
      }
    });
    try {
      const outcome = await taskRunners[key]();
      await prisma.automationRunLog.update({
        where: { id: log.id },
        data: {
          status: "SUCCESS",
          finishedAt: new Date(),
          result: outcome
        }
      });
      if (rule) {
        await prisma.automationRule.update({
          where: { id: rule.id },
          data: { lastRunAt: new Date() }
        });
      }
      results.push({ taskKey: key, ok: true, ...outcome });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Automation task failed";
      await prisma.automationRunLog.update({
        where: { id: log.id },
        data: { status: "FAILED", finishedAt: new Date(), error: message }
      });
      results.push({ taskKey: key, ok: false, error: message });
    }
  }
  return results;
}
