import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { SchedulingSearchWindow } from "@/types/scheduling";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(d);
}

type SchedulingSearchWindowSummaryProps = {
  window?: SchedulingSearchWindow | null;
  label?: string;
};

export function SchedulingSearchWindowSummary({
  window,
  label = "Search window"
}: SchedulingSearchWindowSummaryProps) {
  if (!window?.start || !window?.end) return null;

  return (
    <Card className="bg-card/40">
      <CardTitle className="text-base">{label}</CardTitle>
      <CardDescription className="mt-1">
        {formatDateTime(window.start)} – {formatDateTime(window.end)}
      </CardDescription>
    </Card>
  );
}

