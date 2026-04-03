import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TechnicianJobCard } from "@/components/technician/technician-job-card";
import { TechnicianNextJob } from "@/components/technician/technician-next-job";
import { TechnicianSummary } from "@/components/technician/technician-summary";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useMyTechnicianJobs, useTechnicianStatusActions } from "@/services/technician/technician.hooks";

function isToday(dateIso?: string | null) {
  if (!dateIso) return false;
  const d = new Date(dateIso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function TechnicianDashboardPage() {
  const { toast } = useToast();
  const jobsQuery = useMyTechnicianJobs({ page: 1, limit: 100 });
  const actions = useTechnicianStatusActions();
  const jobs = jobsQuery.data?.items ?? [];

  const todayJobs = useMemo(
    () => jobs.filter((j) => isToday(j.scheduledStart)).sort((a, b) => new Date(a.scheduledStart ?? 0).getTime() - new Date(b.scheduledStart ?? 0).getTime()),
    [jobs]
  );

  const nextJob = useMemo(
    () => todayJobs.find((j) => j.status === "SCHEDULED" || j.status === "NEW") ?? null,
    [todayJobs]
  );

  const completed = todayJobs.filter((j) => j.status === "COMPLETED" || j.status === "INVOICED").length;
  const remaining = Math.max(0, todayJobs.length - completed);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Technician workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground">Focus on your assigned work and update progress quickly.</p>
      </header>

      <TechnicianSummary
        jobsToday={todayJobs.length}
        completed={completed}
        remaining={remaining}
        nextJobTime={nextJob ? formatDateTime(nextJob.scheduledStart) : null}
      />

      <TechnicianNextJob
        job={nextJob}
        busy={actions.isPending}
        onStart={(jobId) =>
          void actions.startJob.mutateAsync(jobId, {
            onSuccess: () => toast({ title: "Job started", variant: "success" })
          })
        }
      />

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Upcoming today</h2>
          <Link to="/technician/jobs" className="text-xs text-primary hover:underline">Open all jobs</Link>
        </div>
        {todayJobs.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">No scheduled jobs today.</Card>
        ) : (
          <div className="space-y-2">
            {todayJobs.slice(0, 4).map((job) => (
              <TechnicianJobCard
                key={job.id}
                job={job}
                busy={actions.isPending}
                onStart={(id) => void actions.startJob.mutateAsync(id)}
                onComplete={(id) => void actions.completeJob.mutateAsync(id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
