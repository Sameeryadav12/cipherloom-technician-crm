import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { SchedulingConflictDialog } from "./scheduling-conflict-dialog";
import {
  getSchedulingExecutionMode,
  getSchedulingSuggestionKey
} from "@/services/scheduling/scheduling-execution";
import type { Job } from "@/types/api";
import type {
  SchedulingExecutionCommitInput,
  SchedulingExecutionDraft,
  SchedulingExecutionMode,
  SchedulingExecutionResult,
  SchedulingConflictSummary,
  SchedulingRequest,
  SchedulingSuggestion
} from "@/types/scheduling";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export type SchedulingCommittedPayload = {
  job: Job;
  mode: SchedulingExecutionMode;
  suggestion: SchedulingSuggestion;
  request: SchedulingRequest;
  customerName: string;
};

type ApplySuggestionDialogProps = {
  open: boolean;
  draft: SchedulingExecutionDraft | null;
  defaultPricingRuleId?: string | null;
  customers: Array<{ id: string; name: string }>;
  commit: (input: SchedulingExecutionCommitInput) => Promise<SchedulingExecutionResult>;
  onClose: () => void;
  onCommitted: (payload: SchedulingCommittedPayload) => void;
};

export function ApplySuggestionDialog({
  open,
  draft,
  defaultPricingRuleId,
  customers,
  commit,
  onClose,
  onCommitted
}: ApplySuggestionDialogProps) {
  const { toast } = useToast();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [conflict, setConflict] = useState<SchedulingConflictSummary | null>(null);
  const [pendingOverride, setPendingOverride] = useState(false);

  useEffect(() => {
    if (!open) {
      setConflict(null);
      setAdvancedOpen(false);
      setPendingOverride(false);
    }
  }, [open]);

  const runCommit = useCallback(
    async (skipConflictCheck: boolean) => {
      if (!draft) return;
      const resolvedCustomerName =
        customers.find((c) => c.id === draft.request.customerId)?.name ?? "Unknown customer";
      setIsExecuting(true);
      try {
        const result = await commit({
          suggestion: draft.suggestion,
          request: draft.request,
          skipConflictCheck,
          defaultPricingRuleId
        });

        if (result.ok) {
          setConflict(null);
          onCommitted({
            job: result.job,
            mode: result.mode,
            suggestion: draft.suggestion,
            request: draft.request,
            customerName: resolvedCustomerName
          });
          toast({
            title: result.mode === "reschedule" ? "Job rescheduled successfully" : "Job scheduled successfully",
            description: `${draft.suggestion.technician.name ?? "Technician"} · ${formatDateTime(draft.suggestion.slot.start)}`,
            variant: "success"
          });
          onClose();
          return;
        }

        if (result.reason === "conflict") {
          setConflict(result.conflict);
          return;
        }

        toast({ title: "Could not schedule", description: result.message, variant: "destructive" });
      } finally {
        setIsExecuting(false);
        setPendingOverride(false);
      }
    },
    [commit, customers, defaultPricingRuleId, draft, onClose, onCommitted, toast]
  );

  const onConfirmPreview = () => {
    void runCommit(false);
  };

  const onProceedAnyway = () => {
    setPendingOverride(true);
    void runCommit(true);
  };

  if (!open || !draft) return null;

  const { suggestion, request } = draft;
  const mode = getSchedulingExecutionMode(request);
  const customerName = customers.find((c) => c.id === request.customerId)?.name ?? "Unknown customer";

  return (
    <>
      <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
          aria-label="Close"
          onClick={() => !isExecuting && onClose()}
        />
        <Card className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto border-border/80 shadow-2xl">
          <div className="border-b border-border/80 bg-gradient-to-r from-primary/10 to-transparent px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/90">Dispatch confirmation</p>
            <CardTitle className="mt-1 text-xl">Apply scheduling suggestion</CardTitle>
            <CardDescription className="mt-2 leading-relaxed">
              Review the slot below. On confirm we run a <strong className="text-foreground">conflict check</strong>, then
              {mode === "create" ? " create a new job" : " update the existing job"} — jobs, calendar, and dashboard data
              refresh automatically.
            </CardDescription>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                mode === "reschedule"
                  ? "border-amber-500/40 bg-amber-950/25 text-amber-100"
                  : "border-emerald-500/35 bg-emerald-950/20 text-emerald-100"
              )}
            >
              {mode === "reschedule" ? "Reschedule existing job" : "Create new job"}
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Technician</dt>
                <dd className="mt-0.5 font-medium text-foreground">{suggestion.technician.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Slot</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {formatDateTime(suggestion.slot.start)} → {formatDateTime(suggestion.slot.end)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</dt>
                <dd className="mt-0.5 text-foreground">{customerName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Job title</dt>
                <dd className="mt-0.5 font-medium text-foreground">{request.title.trim()}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Duration</dt>
                <dd className="mt-0.5 text-foreground">{request.durationMinutes} minutes (from your request)</dd>
              </div>
              {request.requiredSkills?.length ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Required skills</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {request.requiredSkills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>

            {suggestion.reason ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Assistant note: </span>
                {suggestion.reason}
              </div>
            ) : null}

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Assumptions:</strong> default pricing rule applies to new jobs when set.
              Reschedule updates title, customer, technician, and this window; other job fields are unchanged.
            </p>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted/20"
              onClick={() => setAdvancedOpen((v) => !v)}
            >
              Technical context
              {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {advancedOpen ? (
              <div className="rounded-lg border border-border/50 bg-background/50 p-3 font-mono text-[10px] text-muted-foreground">
                <div>Suggestion key: {getSchedulingSuggestionKey(suggestion)}</div>
                {request.ignoreJobId ? <div className="mt-1">ignoreJobId: {request.ignoreJobId}</div> : null}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" disabled={isExecuting} onClick={onClose}>
                Cancel
              </Button>
              <Link
                to={`/technicians/${suggestion.technician.id}`}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted sm:h-10"
                onClick={onClose}
              >
                Open technician
              </Link>
              <Button type="button" variant="default" className="min-w-[160px] font-semibold" disabled={isExecuting} onClick={onConfirmPreview}>
                {isExecuting && !conflict ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Working…
                  </>
                ) : (
                  "Confirm schedule"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <SchedulingConflictDialog
        open={Boolean(conflict)}
        technicianName={conflict?.technicianName ?? ""}
        conflicts={conflict?.items ?? []}
        isSubmitting={pendingOverride && isExecuting}
        onProceedAnyway={onProceedAnyway}
        onChooseAnotherSuggestion={() => setConflict(null)}
      />
    </>
  );
}
