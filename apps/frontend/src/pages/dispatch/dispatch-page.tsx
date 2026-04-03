import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DispatchQueueFilters } from "@/components/dispatch/dispatch-queue-filters";
import { DispatchQueueTable } from "@/components/dispatch/dispatch-queue-table";
import { QueueSummaryCards } from "@/components/dispatch/queue-summary-cards";
import { RescheduleJobDialog } from "@/components/dispatch/reschedule-job-dialog";
import { AssignTechnicianDialog } from "@/components/jobs/assign-technician-dialog";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { useDispatchQueue } from "@/services/dispatch/dispatch.hooks";
import { useAssignTechnician } from "@/services/jobs/jobs.hooks";
import { useTechniciansList } from "@/services/technicians/technicians.hooks";
import type { DispatchQueueItem, DispatchQueueKey, RescheduleJobContext } from "@/types/dispatch";

export function DispatchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeQueue, setActiveQueue] = useState<DispatchQueueKey | "all">("all");
  const [assignTarget, setAssignTarget] = useState<DispatchQueueItem | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<RescheduleJobContext | null>(null);
  const queue = useDispatchQueue(activeQueue);
  const assignMutation = useAssignTechnician();
  const techniciansQuery = useTechniciansList({ page: 1, limit: 100, isActive: true });

  const queueTitle = useMemo(() => (activeQueue === "all" ? "Dispatch Queue" : `Dispatch Queue · ${activeQueue.replace("_", " ")}`), [activeQueue]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Field operations</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dispatch</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Central action queue for assignment, rescheduling, and dispatch lifecycle decisions across Jobs, Calendar, and Smart Scheduling.
        </p>
      </header>

      <QueueSummaryCards summary={queue.summary} />
      <DispatchQueueFilters activeQueue={activeQueue} onChangeQueue={setActiveQueue} />

      {queue.isLoading ? (
        <Card>
          <CardTitle>Loading dispatch queue…</CardTitle>
          <CardDescription className="mt-2">Aggregating jobs, schedule urgency, and invoice readiness.</CardDescription>
        </Card>
      ) : queue.isError ? (
        <Card>
          <CardTitle>Dispatch queue unavailable</CardTitle>
          <CardDescription className="mt-2">Could not load queue data. Refresh and retry.</CardDescription>
        </Card>
      ) : (
        <DispatchQueueTable
          items={queue.items}
          onAssign={(item) => setAssignTarget(item)}
          onReschedule={(item) =>
            setRescheduleTarget({
              jobId: item.job.id,
              title: item.job.title,
              customerId: item.job.customerId,
              customerName: item.job.customer?.name,
              technicianId: item.job.technicianId,
              technicianName: item.job.technician?.name,
              scheduledStart: item.job.scheduledStart,
              scheduledEnd: item.job.scheduledEnd,
              status: item.job.status
            })
          }
        />
      )}

      <AssignTechnicianDialog
        open={Boolean(assignTarget)}
        technicians={techniciansQuery.data?.items ?? []}
        currentTechnicianName={assignTarget?.job.technician?.name}
        isSubmitting={assignMutation.isPending}
        onClose={() => setAssignTarget(null)}
        onSubmit={async (technicianId) => {
          if (!assignTarget) return;
          try {
            await assignMutation.mutateAsync({ id: assignTarget.job.id, technicianId });
            toast({ title: "Technician assigned", description: "Dispatch queue refreshed.", variant: "success" });
            setAssignTarget(null);
            queue.refetch();
          } catch (error) {
            toast({
              title: "Assignment failed",
              description: error instanceof ApiError ? error.message : "Could not assign technician.",
              variant: "destructive"
            });
          }
        }}
      />

      <RescheduleJobDialog
        open={Boolean(rescheduleTarget)}
        context={rescheduleTarget}
        onClose={() => {
          setRescheduleTarget(null);
          queue.refetch();
          navigate("/dispatch");
        }}
      />

      <p className="text-xs text-muted-foreground">Current queue: {queueTitle}</p>
    </div>
  );
}
