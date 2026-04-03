import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Job } from "@/types/api";
import type { SchedulingExecutionMode } from "@/types/scheduling";

export type SchedulingSuccessSummary = {
  job: Job;
  mode: SchedulingExecutionMode;
  technicianLabel: string;
  slotLabel: string;
  customerLabel: string;
};

type SchedulingSuccessStateProps = {
  summary: SchedulingSuccessSummary | null;
  onDismiss: () => void;
};

export function SchedulingSuccessState({ summary, onDismiss }: SchedulingSuccessStateProps) {
  if (!summary) return null;

  return (
    <Card className="border-emerald-500/35 bg-emerald-950/15">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base text-emerald-50">
              {summary.mode === "reschedule" ? "Reschedule committed" : "Job created from assistant"}
            </CardTitle>
            <CardDescription className="mt-1 text-emerald-100/85">
              {summary.technicianLabel} · {summary.slotLabel}
              <br />
              <span className="text-emerald-100/70">{summary.customerLabel}</span>
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/jobs/${summary.job.id}`}
            className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium hover:bg-muted"
          >
            Open job
          </Link>
          <Link
            to="/calendar"
            className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium hover:bg-muted"
          >
            View calendar
          </Link>
          <Button type="button" variant="ghost" className="h-8 text-xs" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </Card>
  );
}
