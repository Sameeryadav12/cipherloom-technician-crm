import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function TimeOffEmptyState() {
  return (
    <Card>
      <CardTitle>No time-off entries</CardTitle>
      <CardDescription className="mt-2">
        Add time-off records for this technician to support conflict-aware scheduling.
      </CardDescription>
    </Card>
  );
}

