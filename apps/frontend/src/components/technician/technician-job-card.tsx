import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { JobListItem } from "@/types/jobs";

type TechnicianJobCardProps = {
  job: JobListItem;
  onStart: (jobId: string) => void;
  onComplete: (jobId: string) => void;
  busy?: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Not scheduled";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function TechnicianJobCard({ job, onStart, onComplete, busy }: TechnicianJobCardProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{job.title}</p>
          <p className="text-sm text-muted-foreground">{job.customer?.name ?? "Customer"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(job.scheduledStart)} → {formatDateTime(job.scheduledEnd)}
          </p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button className="h-9 px-4" disabled={busy || job.status !== "SCHEDULED"} onClick={() => onStart(job.id)}>
          Start job
        </Button>
        <Button variant="outline" className="h-9 px-4" disabled={busy || (job.status !== "IN_PROGRESS" && job.status !== "SCHEDULED")} onClick={() => onComplete(job.id)}>
          Mark complete
        </Button>
        <Link to={`/technician/jobs/${job.id}`} className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">
          View details
        </Link>
      </div>
    </div>
  );
}
