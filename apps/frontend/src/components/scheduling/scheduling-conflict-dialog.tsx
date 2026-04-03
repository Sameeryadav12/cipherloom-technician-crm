import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { ConflictItem } from "@/types/calendar";

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${start} – ${end}`;
  return `${s.toLocaleString()} – ${e.toLocaleString()}`;
}

export type SchedulingConflictDialogProps = {
  open: boolean;
  technicianName: string;
  conflicts: ConflictItem[];
  isSubmitting?: boolean;
  /** Dispatcher explicitly accepts overlap risk (backend still enforces data rules). */
  onProceedAnyway: () => void;
  onChooseAnotherSuggestion: () => void;
};

export function SchedulingConflictDialog({
  open,
  technicianName,
  conflicts,
  isSubmitting,
  onProceedAnyway,
  onChooseAnotherSuggestion
}: SchedulingConflictDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={onChooseAnotherSuggestion}
      />
      <Card className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-auto border-amber-500/35 bg-card shadow-2xl">
        <CardTitle className="text-lg text-amber-100">Scheduling conflict detected</CardTitle>
        <CardDescription className="mt-2 leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{technicianName}</span> has overlapping work or approved leave in
          this window. Choose another suggestion, review the board, or proceed only if your operations policy allows a
          double-booking.
        </CardDescription>

        <ul className="mt-4 space-y-3 text-sm">
          {conflicts.map((c) => (
            <li key={`${c.type}-${c.id}`} className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {c.type === "job" ? "Job" : "Time off"}
              </div>
              <div className="font-medium text-foreground">{c.title}</div>
              <div className="text-xs text-muted-foreground">{formatRange(c.start, c.end)}</div>
              {c.message ? <div className="mt-1 text-xs text-amber-200/90">{c.message}</div> : null}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/calendar"
            onClick={onChooseAnotherSuggestion}
            className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            Review calendar
          </Link>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onChooseAnotherSuggestion}>
            Choose another suggestion
          </Button>
          <Button type="button" variant="default" disabled={isSubmitting} onClick={onProceedAnyway}>
            {isSubmitting ? "Applying…" : "Proceed anyway"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
