import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "./job-status-badge";
import type { JobDetail } from "@/types/jobs";

type JobDetailCardProps = {
  job: JobDetail;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function assignmentState(job: JobDetail) {
  if (!job.technicianId) return "Unassigned";
  if (!job.scheduledStart || !job.scheduledEnd) return "Needs reassignment";
  if (job.status === "SCHEDULED") return "Pending confirmation";
  if (job.status === "IN_PROGRESS" || job.status === "COMPLETED" || job.status === "INVOICED") {
    return "Confirmed";
  }
  return "Assigned";
}

export function JobDetailCard({ job }: JobDetailCardProps) {
  return (
    <Card>
      <CardTitle>{job.title}</CardTitle>
      <CardDescription className="mt-2">Job profile and assignment details.</CardDescription>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <JobStatusBadge status={job.status} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Customer</dt>
          <dd>{job.customer?.name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Technician</dt>
          <dd>{job.technician?.name ?? "Unassigned"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Dispatch assignment</dt>
          <dd>{assignmentState(job)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pricing Rule</dt>
          <dd>{job.pricingRule?.name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Scheduled Start</dt>
          <dd>{formatDateTime(job.scheduledStart)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Scheduled End</dt>
          <dd>{formatDateTime(job.scheduledEnd)}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-muted-foreground">Description</dt>
          <dd>{job.description?.trim() || "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatDateTime(job.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{formatDateTime(job.updatedAt)}</dd>
        </div>
      </dl>
    </Card>
  );
}

