-- CreateIndex
CREATE INDEX "jobs_technicianId_scheduledStart_scheduledEnd_idx" ON "jobs"("technicianId", "scheduledStart", "scheduledEnd");

-- CreateIndex
CREATE INDEX "time_off_technicianId_start_end_idx" ON "time_off"("technicianId", "start", "end");
