import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { runAutomationTasks } from "./automation.runner.js";
import type { AutomationTaskKey } from "./automation.types.js";

const DEFAULT_RULES: Array<{
  key: AutomationTaskKey;
  name: string;
  config?: Record<string, unknown>;
}> = [
  { key: "recurring_jobs", name: "Recurring Jobs" },
  { key: "invoice_reminders", name: "Invoice Reminders", config: { dueSoonDays: 2 } },
  { key: "stale_jobs", name: "Stale Job Alerts", config: { staleHours: 24 } },
  { key: "dispatch_attention", name: "Dispatch Attention Checks" },
  { key: "auto_assignment_suggestions", name: "Auto-Assignment Suggestions" }
];

export async function ensureAutomationRules() {
  for (const rule of DEFAULT_RULES) {
    await prisma.automationRule.upsert({
      where: { key: rule.key },
      update: {},
      create: {
        key: rule.key,
        name: rule.name,
        config: (rule.config ?? {}) as Prisma.InputJsonValue
      }
    });
  }
}

export async function listAutomationRules() {
  await ensureAutomationRules();
  return prisma.automationRule.findMany({ orderBy: [{ createdAt: "asc" }] });
}

export async function updateAutomationRule(
  id: string,
  input: { isEnabled?: boolean; config?: Record<string, unknown>; nextRunAt?: Date }
) {
  return prisma.automationRule.update({
    where: { id },
    data: {
      ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
      ...(input.config !== undefined
        ? { config: input.config as Prisma.InputJsonValue }
        : {}),
      ...(input.nextRunAt !== undefined ? { nextRunAt: input.nextRunAt } : {})
    }
  });
}

export async function runAutomation(taskKey?: AutomationTaskKey) {
  await ensureAutomationRules();
  const results = await runAutomationTasks(taskKey);
  return { ranAt: new Date(), results };
}

export async function getAutomationStatus() {
  await ensureAutomationRules();
  const [rules, recentRuns] = await Promise.all([
    prisma.automationRule.findMany({ orderBy: [{ createdAt: "asc" }] }),
    prisma.automationRunLog.findMany({
      orderBy: [{ startedAt: "desc" }],
      take: 15
    })
  ]);
  return { rules, recentRuns };
}
