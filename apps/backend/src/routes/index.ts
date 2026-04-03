import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { aggregatesRouter } from "../modules/aggregates/aggregates.routes.js";
import { calendarRouter } from "../modules/calendar/calendar.routes.js";
import { customerRouter } from "../modules/customers/customer.routes.js";
import { dispatchRouter } from "../modules/dispatch/dispatch.routes.js";
import { invoiceRouter } from "../modules/invoices/invoice.routes.js";
import { jobRouter } from "../modules/jobs/job.routes.js";
import { notificationRouter } from "../modules/notifications/notification.routes.js";
import { automationRouter } from "../modules/automation/automation.routes.js";
import { recurringJobsRouter } from "../modules/recurring-jobs/recurring-jobs.routes.js";
import { schedulingRouter } from "../modules/scheduling/scheduling.routes.js";
import { pricingRulesRouter } from "../modules/settings/pricingRules.routes.js";
import { timeOffRouter } from "../modules/time-off/timeOff.routes.js";
import { technicianRouter } from "../modules/technicians/technician.routes.js";
import { healthRouter } from "./health.routes.js";

export function buildApiRouter() {
  const router = Router();
  router.use(healthRouter);
  router.use("/auth", authRouter);
  router.use("/aggregates", aggregatesRouter);
  router.use("/customers", customerRouter);
  router.use("/dispatch", dispatchRouter);
  router.use("/technicians", technicianRouter);
  router.use("/time-off", timeOffRouter);
  router.use("/jobs", jobRouter);
  router.use("/invoices", invoiceRouter);
  router.use("/notifications", notificationRouter);
  router.use("/automation", automationRouter);
  router.use("/recurring-jobs", recurringJobsRouter);
  router.use("/calendar", calendarRouter);
  router.use("/scheduling", schedulingRouter);
  router.use("/settings", pricingRulesRouter);
  return router;
}

