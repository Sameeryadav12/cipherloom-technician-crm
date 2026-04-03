import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { created, ok, paginated } from "../../utils/api-response.js";
import type { GenerateInvoiceBody } from "../invoices/invoice.schemas.js";
import * as invoiceService from "../invoices/invoice.service.js";
import type {
  AssignTechnicianBody,
  CreateJobBody,
  ListJobsQuery,
  UpdateJobBody,
  UpdateJobStatusBody
} from "./job.schemas.js";
import type { JobAuthContext } from "./job.types.js";
import * as jobService from "./job.service.js";

function jobAuth(req: Request): JobAuthContext {
  if (!req.user) {
    throw new AppError({
      statusCode: 401,
      message: "Unauthorized"
    });
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function listJobs(req: Request, res: Response) {
  const query = req.query as unknown as ListJobsQuery;
  const data = await jobService.listJobs(query, jobAuth(req));
  return paginated(res, data);
}

export async function getJobById(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const job = await jobService.getJobById(id, jobAuth(req));
  return ok(res, { job });
}

export async function createJob(req: Request, res: Response) {
  const body = req.body as CreateJobBody;
  const job = await jobService.createJob(body, jobAuth(req));
  return created(res, { job }, { message: "Job created" });
}

export async function updateJob(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as UpdateJobBody;
  const job = await jobService.updateJob(id, body, jobAuth(req));
  return ok(res, { job }, { message: "Job updated" });
}

export async function deleteJob(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  await jobService.deleteJob(id);
  return ok(res, { deleted: true }, { message: "Job deleted" });
}

export async function assignTechnician(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as AssignTechnicianBody;
  const job = await jobService.assignTechnician(id, body);
  return ok(res, { job }, { message: "Technician assigned" });
}

export async function updateJobStatus(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as UpdateJobStatusBody;
  const job = await jobService.updateStatus(id, body, jobAuth(req));
  return ok(res, { job }, { message: "Job status updated" });
}

export async function generateInvoiceForJob(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as GenerateInvoiceBody;
  const auth = jobAuth(req);
  const invoice = await invoiceService.generateInvoiceFromJob(id, body, auth);
  return created(
    res,
    { invoice },
    { message: "Invoice generated from job" }
  );
}
