import { Link } from "react-router-dom";
import { CalendarClock, ChevronRight, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
type CalendarToolbarProps = {
  rangeLabel?: string;
  onCheckConflicts: () => void;
  onToday?: () => void;
};

export function CalendarToolbar({ rangeLabel, onCheckConflicts, onToday }: CalendarToolbarProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-card/50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5 rounded-lg border border-primary/25 bg-primary/10 p-1.5 text-primary">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Visible range
            </p>
            <p className="truncate text-sm font-medium text-foreground">
              {rangeLabel ? rangeLabel : "Pan the calendar to load a window"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 lg:border-t-0 lg:pt-0">
          <span className="mr-1 hidden text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
            Quick actions
          </span>
          <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={onToday}>
            Today
          </Button>
          <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={onCheckConflicts}>
            Check conflicts
          </Button>
          <Link
            to="/scheduling"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Scheduling
          </Link>
          <Link
            to="/jobs?new=1"
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-glow transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-3.5 w-3.5" />
            Create job
          </Link>
        </div>
      </div>
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <ChevronRight className="h-3 w-3 shrink-0 opacity-70" />
        Tip: use week or day view for time blocks; month view is best for coverage at a glance.
      </p>
    </div>
  );
}
