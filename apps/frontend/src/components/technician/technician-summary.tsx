import { Card } from "@/components/ui/card";

type TechnicianSummaryProps = {
  jobsToday: number;
  completed: number;
  remaining: number;
  nextJobTime?: string | null;
};

export function TechnicianSummary({ jobsToday, completed, remaining, nextJobTime }: TechnicianSummaryProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="p-3"><p className="text-xs text-muted-foreground">Jobs today</p><p className="text-2xl font-semibold">{jobsToday}</p></Card>
      <Card className="p-3"><p className="text-xs text-muted-foreground">Completed</p><p className="text-2xl font-semibold">{completed}</p></Card>
      <Card className="p-3"><p className="text-xs text-muted-foreground">Remaining</p><p className="text-2xl font-semibold">{remaining}</p></Card>
      <Card className="p-3"><p className="text-xs text-muted-foreground">Next job</p><p className="text-sm font-medium">{nextJobTime ?? "No more today"}</p></Card>
    </div>
  );
}
