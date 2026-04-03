import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type CalendarEmptyStateProps = {
  reason: "no-filters" | "no-events";
};

export function CalendarEmptyState({ reason }: CalendarEmptyStateProps) {
  if (reason === "no-filters") {
    return (
      <Card className="border-amber-500/40 bg-amber-950/10">
        <CardTitle className="text-base">Select event types</CardTitle>
        <CardDescription className="mt-2">
          Turn on <strong>Jobs</strong> and/or <strong>Time off</strong> to load the calendar.
        </CardDescription>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle className="text-base">No events in this range</CardTitle>
      <CardDescription className="mt-2">
        Try another date range or adjust filters. Scheduled jobs and time-off will appear here.
      </CardDescription>
    </Card>
  );
}
