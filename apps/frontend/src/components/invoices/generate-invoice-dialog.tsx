import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { JobListItem } from "@/types/jobs";

type GenerateInvoiceDialogProps = {
  open: boolean;
  jobs: JobListItem[];
  jobIdsWithInvoice?: Set<string>;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (jobId: string) => Promise<void> | void;
};

export function GenerateInvoiceDialog({
  open,
  jobs,
  jobIdsWithInvoice,
  isSubmitting = false,
  error,
  onClose,
  onSubmit
}: GenerateInvoiceDialogProps) {
  const [jobId, setJobId] = useState("");

  useEffect(() => {
    if (open) setJobId("");
  }, [open]);

  const selected = useMemo(() => jobs.find((j) => j.id === jobId) ?? null, [jobId, jobs]);

  const warnings = useMemo(() => {
    if (!selected) return [] as string[];
    const list: string[] = [];
    if (selected.status !== "COMPLETED") {
      list.push("Job is not completed — billing may be premature.");
    }
    if (!selected.pricingRuleId) {
      list.push("No pricing rule on file — totals may need manual review after generation.");
    }
    if (jobIdsWithInvoice?.has(selected.id)) {
      list.push("An invoice may already exist for this job — check the list before generating again.");
    }
    return list;
  }, [jobIdsWithInvoice, selected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]">
      <Card className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border/80 p-0 shadow-surface-lg">
        <div className="border-b border-border/80 px-6 py-5">
          <CardTitle className="text-xl">Generate invoice from job</CardTitle>
          <CardDescription className="mt-2 leading-relaxed">
            Pick a completed job. We surface customer, technician, and pricing context so billing feels
            informed — not like a blind dropdown.
          </CardDescription>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-1">
            <label className="text-sm font-medium">Job</label>
            <select
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              <option value="">Select a job…</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.customer?.name ?? "Customer"}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Only jobs in <span className="font-medium text-foreground">Completed</span> status appear
              here.
            </p>
          </div>

          {selected ? (
            <div className="space-y-3 rounded-xl border border-border/70 bg-muted/25 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Selection preview</p>
                <JobStatusBadge status={selected.status} />
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd className="text-right font-medium">{selected.customer?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Technician</dt>
                  <dd className="text-right">{selected.technician?.name ?? "Unassigned"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Pricing rule</dt>
                  <dd className="text-right">{selected.pricingRule?.name ?? "—"}</dd>
                </div>
              </dl>

              {warnings.length > 0 ? (
                <ul className="space-y-2 border-t border-border/60 pt-3">
                  {warnings.map((w) => (
                    <li
                      key={w}
                      className="flex gap-2 text-xs text-amber-100/95"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-emerald-200/90">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Looks eligible to generate — confirm below.
                </p>
              )}
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mx-6 mb-2 rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className={cn("flex justify-end gap-2 border-t border-border/80 px-6 py-4")}>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button disabled={isSubmitting || !jobId} onClick={() => void onSubmit(jobId)}>
            {isSubmitting ? "Generating…" : "Generate invoice"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
