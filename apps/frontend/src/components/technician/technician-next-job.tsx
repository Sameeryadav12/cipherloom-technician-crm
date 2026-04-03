import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { JobListItem } from "@/types/jobs";

type TechnicianNextJobProps = {
  job: JobListItem | null;
  onStart: (jobId: string) => void;
  busy?: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Not scheduled";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function TechnicianNextJob({ job, onStart, busy }: TechnicianNextJobProps) {
  if (!job) {
    return (
      <Card>
        <CardTitle className="text-base">No upcoming jobs</CardTitle>
        <CardDescription className="mt-2">You are clear for now. New assignments will appear here.</CardDescription>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/[0.08]">
      <CardTitle className="text-base">Next job</CardTitle>
      <CardDescription className="mt-2">
        <span className="font-medium text-foreground">{job.title}</span> • {job.customer?.name ?? "Customer"}
      </CardDescription>
      <p className="mt-2 text-sm text-muted-foreground">
        {formatDateTime(job.scheduledStart)} → {formatDateTime(job.scheduledEnd)}
      </p>
      <div className="mt-3 flex gap-2">
        <Button disabled={busy || job.status !== "SCHEDULED"} onClick={() => onStart(job.id)}>
          Start job
        </Button>
        <Link to={`/technician/jobs/${job.id}`} className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">
          View details
        </Link>
      </div>
    </Card>
  );
}
