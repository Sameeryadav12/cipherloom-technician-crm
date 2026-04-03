import { AlertTriangle, CalendarClock, FileText, TimerReset, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DispatchSummary } from "@/types/dispatch";

type QueueSummaryCardsProps = {
  summary: DispatchSummary;
};

function SummaryCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: typeof UserX;
}) {
  return (
    <Card className="border-border/70 bg-card/50 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

export function QueueSummaryCards({ summary }: QueueSummaryCardsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
      <SummaryCard label="Unassigned" value={summary.unassigned} icon={UserX} />
      <SummaryCard label="Needs Scheduling" value={summary.needsScheduling} icon={CalendarClock} />
      <SummaryCard label="Conflict Risk" value={summary.conflicted} icon={AlertTriangle} />
      <SummaryCard label="Starts Soon" value={summary.startsSoon} icon={TimerReset} />
      <SummaryCard label="Ready to Invoice" value={summary.readyToInvoice} icon={FileText} />
      <SummaryCard label="Aging" value={summary.stale} icon={AlertTriangle} />
    </div>
  );
}
