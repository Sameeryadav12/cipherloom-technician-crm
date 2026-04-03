import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useSchedulingExecution } from "@/services/scheduling/scheduling.hooks";
import { useTechniciansList } from "@/services/technicians/technicians.hooks";
import type { RescheduleJobContext } from "@/types/dispatch";
import type { SchedulingSuggestion } from "@/types/scheduling";

type RescheduleJobDialogProps = {
  open: boolean;
  context: RescheduleJobContext | null;
  onClose: () => void;
};

function toDateTimeLocal(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoLocal(value: string) {
  return new Date(value).toISOString();
}

function durationMinutes(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 60;
  return Math.max(15, Math.round((end - start) / 60_000));
}

export function RescheduleJobDialog({ open, context, onClose }: RescheduleJobDialogProps) {
  const { toast } = useToast();
  const techniciansQuery = useTechniciansList({ page: 1, limit: 100, isActive: true });
  const execution = useSchedulingExecution();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [notifyTech, setNotifyTech] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !context) return;
    setStart(toDateTimeLocal(context.scheduledStart));
    setEnd(toDateTimeLocal(context.scheduledEnd));
    setTechnicianId(context.technicianId ?? "");
    setDispatchNotes("");
    setNotifyTech(true);
    setError(null);
  }, [context, open]);

  const selectedTech = useMemo(
    () => techniciansQuery.data?.items.find((t) => t.id === technicianId),
    [technicianId, techniciansQuery.data?.items]
  );

  const smartScheduleState = useMemo(() => {
    if (!context) return undefined;
    return {
      prefillCustomerId: context.customerId,
      prefillTitle: context.title,
      prefillIgnoreJobId: context.jobId
    };
  }, [context]);

  if (!open || !context) return null;

  const canSubmit = Boolean(start && end && technicianId);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    const startIso = toIsoLocal(start);
    const endIso = toIsoLocal(end);
    const suggestion: SchedulingSuggestion = {
      technician: { id: technicianId, name: selectedTech?.name },
      slot: { start: startIso, end: endIso },
      reason: dispatchNotes.trim() || "Manual dispatch reschedule"
    };
    const result = await execution.commit({
      suggestion,
      request: {
        customerId: context.customerId,
        title: context.title,
        durationMinutes: durationMinutes(startIso, endIso),
        technicianId,
        ignoreJobId: context.jobId,
        requiredSkills: context.requiredSkills?.length ? context.requiredSkills : undefined
      }
    });

    if (!result.ok) {
      const message = result.reason === "error" ? result.message : "Scheduling conflict detected. Use Smart Scheduling.";
      setError(message);
      toast({ title: "Reschedule blocked", description: message, variant: "destructive" });
      return;
    }

    toast({
      title: "Job rescheduled successfully",
      description: notifyTech
        ? "Dispatch note captured. Technician notification workflow is ready for next phase."
        : "Schedule updated without technician notification.",
      variant: "success"
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-2xl">
        <CardTitle>Reschedule job</CardTitle>
        <CardDescription className="mt-2">
          Update schedule safely from dispatch context. This uses the shared scheduling execution flow with conflict checks.
        </CardDescription>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Job</p>
            <p className="font-medium">{context.title}</p>
            <p className="text-muted-foreground">{context.customerName ?? "Unknown customer"}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current slot</p>
            <p>{toDateTimeLocal(context.scheduledStart) || "Not scheduled"}</p>
            <p>{toDateTimeLocal(context.scheduledEnd) || "—"}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start</label>
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End</label>
            <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Technician</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
            >
              <option value="">Select technician</option>
              {(techniciansQuery.data?.items ?? []).map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Dispatch note (foundation)</label>
          <Input
            value={dispatchNotes}
            placeholder="Internal dispatch note for technician handoff"
            onChange={(e) => setDispatchNotes(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={notifyTech} onChange={(e) => setNotifyTech(e.target.checked)} />
            Notify technician (placeholder for upcoming notification workflow)
          </label>
        </div>

        {error ? (
          <p className="mt-3 rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-200">{error}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Link to="/scheduling" state={smartScheduleState} className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm hover:bg-muted" onClick={onClose}>
            Smart scheduling
          </Link>
          <Button variant="ghost" onClick={onClose} disabled={execution.isBusy}>
            Cancel
          </Button>
          <Button onClick={() => void onSubmit()} disabled={!canSubmit || execution.isBusy}>
            {execution.isBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rescheduling...
              </>
            ) : (
              "Apply reschedule"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
