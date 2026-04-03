-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "recurrenceOccurrenceDate" TIMESTAMP(3),
ADD COLUMN     "recurringTemplateId" TEXT;

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_run_logs" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "taskKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_event_logs" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_job_templates" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "technicianId" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "recurrencePattern" "RecurrencePattern" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastGeneratedAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_job_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_job_occurrences" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "occurrenceDate" TIMESTAMP(3) NOT NULL,
    "generatedJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_job_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "automation_rules_key_key" ON "automation_rules"("key");

-- CreateIndex
CREATE INDEX "automation_run_logs_taskKey_startedAt_idx" ON "automation_run_logs"("taskKey", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "automation_run_logs_ruleId_startedAt_idx" ON "automation_run_logs"("ruleId", "startedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "automation_event_logs_eventKey_key" ON "automation_event_logs"("eventKey");

-- CreateIndex
CREATE INDEX "automation_event_logs_eventType_createdAt_idx" ON "automation_event_logs"("eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "automation_event_logs_entityType_entityId_idx" ON "automation_event_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "recurring_job_templates_isActive_nextRunAt_idx" ON "recurring_job_templates"("isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "recurring_job_templates_customerId_idx" ON "recurring_job_templates"("customerId");

-- CreateIndex
CREATE INDEX "recurring_job_occurrences_occurrenceDate_idx" ON "recurring_job_occurrences"("occurrenceDate");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_job_occurrences_templateId_occurrenceDate_key" ON "recurring_job_occurrences"("templateId", "occurrenceDate");

-- CreateIndex
CREATE INDEX "jobs_recurringTemplateId_recurrenceOccurrenceDate_idx" ON "jobs"("recurringTemplateId", "recurrenceOccurrenceDate");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_recurringTemplateId_fkey" FOREIGN KEY ("recurringTemplateId") REFERENCES "recurring_job_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_run_logs" ADD CONSTRAINT "automation_run_logs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "automation_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_job_templates" ADD CONSTRAINT "recurring_job_templates_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_job_templates" ADD CONSTRAINT "recurring_job_templates_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_job_templates" ADD CONSTRAINT "recurring_job_templates_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_job_occurrences" ADD CONSTRAINT "recurring_job_occurrences_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "recurring_job_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_job_occurrences" ADD CONSTRAINT "recurring_job_occurrences_generatedJobId_fkey" FOREIGN KEY ("generatedJobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
