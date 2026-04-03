import { useMemo } from "react";
import { TechnicianJobCard } from "@/components/technician/technician-job-card";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useMyTechnicianJobs, useTechnicianStatusActions } from "@/services/technician/technician.hooks";

function jobBucket(job: { scheduledStart?: string | null }) {
  if (!job.scheduledStart) return "unscheduled";
  const s = new Date(job.scheduledStart);
  const n = new Date();
  const startDay = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
  const nowDay = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  if (startDay < nowDay) return "overdue";
  if (startDay === nowDay) return "today";
  return "upcoming";
}

export function TechnicianJobsPage() {
  const { toast } = useToast();
  const jobsQuery = useMyTechnicianJobs({ page: 1, limit: 200 });
  const actions = useTechnicianStatusActions();
  const jobs = useMemo(
    () =>
      (jobsQuery.data?.items ?? []).sort(
        (a, b) => new Date(a.scheduledStart ?? 0).getTime() - new Date(b.scheduledStart ?? 0).getTime()
      ),
    [jobsQuery.data?.items]
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My jobs</h1>
        <p className="text-sm text-muted-foreground">Assigned work only. Update status as you move through the day.</p>
      </header>
      {jobs.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">No assigned jobs right now.</Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className={jobBucket(job) === "overdue" ? "rounded-xl border border-red-500/30 p-1" : ""}>
              <TechnicianJobCard
                job={job}
                busy={actions.isPending}
                onStart={(id) =>
                  void actions.startJob.mutateAsync(id, { onSuccess: () => toast({ title: "Job started", variant: "success" }) })
                }
                onComplete={(id) =>
                  void actions.completeJob.mutateAsync(id, { onSuccess: () => toast({ title: "Job completed", variant: "success" }) })
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
