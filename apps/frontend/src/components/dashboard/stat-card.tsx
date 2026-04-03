import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardStat } from "@/types/dashboard";

const accentMap: Record<NonNullable<DashboardStat["accent"]>, string> = {
  blue: "border-blue-500/40",
  green: "border-emerald-500/40",
  amber: "border-amber-500/40",
  violet: "border-violet-500/40"
};

type StatCardProps = {
  stat: DashboardStat;
};

export function StatCard({ stat }: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden space-y-2 border-border/70 bg-card/80",
        "transition-colors hover:border-primary/25",
        stat.accent ? accentMap[stat.accent] : ""
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full",
          stat.accent === "blue" && "bg-blue-500/70",
          stat.accent === "green" && "bg-emerald-500/70",
          stat.accent === "amber" && "bg-amber-500/70",
          stat.accent === "violet" && "bg-violet-500/70"
        )}
      />
      <CardDescription className="pl-2">{stat.title}</CardDescription>
      <CardTitle className="pl-2 text-3xl tabular-nums tracking-tight">{stat.value}</CardTitle>
      <p className="pl-2 text-xs leading-relaxed text-muted-foreground">{stat.helper}</p>
    </Card>
  );
}

