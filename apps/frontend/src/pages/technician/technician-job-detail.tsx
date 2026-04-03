import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { useToast } from "@/components/ui/toast";
import { useMyTechnicianJobs, useTechnicianStatusActions } from "@/services/technician/technician.hooks";

function formatDateTime(value?: string | null) {
  if (!value) return "Not scheduled";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function TechnicianJobDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const jobsQuery = useMyTechnicianJobs({ page: 1, limit: 250 });
  const actions = useTechnicianStatusActions();
  const job = useMemo(() => (jobsQuery.data?.items ?? []).find((j) => j.id === id) ?? null, [id, jobsQuery.data?.items]);

  if (!id) return <Navigate to="/technician/jobs" replace />;
  if (jobsQuery.isLoading) return <Card><CardTitle>Loading job…</CardTitle></Card>;
  if (!job) return <Navigate to="/technician/jobs" replace />;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.customer?.name ?? "Customer"}</p>
        </div>
        <JobStatusBadge status={job.status} />
      </header>

      <Card>
        <CardTitle className="text-base">Work details</CardTitle>
        <CardDescription className="mt-2">Focused job context for field execution.</CardDescription>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Schedule</dt><dd>{formatDateTime(job.scheduledStart)} → {formatDateTime(job.scheduledEnd)}</dd></div>
          <div><dt className="text-muted-foreground">Technician</dt><dd>{job.technician?.name ?? "Assigned"}</dd></div>
          <div className="md:col-span-2"><dt className="text-muted-foreground">Description</dt><dd>{job.description?.trim() || "-"}</dd></div>
        </dl>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button disabled={actions.isPending || job.status !== "SCHEDULED"} onClick={() => void actions.startJob.mutateAsync(job.id, { onSuccess: () => toast({ title: "Job started", variant: "success" }) })}>
          Start job
        </Button>
        <Button variant="outline" disabled={actions.isPending || (job.status !== "IN_PROGRESS" && job.status !== "SCHEDULED")} onClick={() => void actions.completeJob.mutateAsync(job.id, { onSuccess: () => toast({ title: "Job completed", variant: "success" }) })}>
          Mark completed
        </Button>
        <Link to="/technician/jobs" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">
          Back to my jobs
        </Link>
      </div>
    </div>
  );
}
