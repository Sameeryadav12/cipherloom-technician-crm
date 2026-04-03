import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function DashboardEmptyState() {
  return (
    <Card>
      <CardTitle>No activity yet</CardTitle>
      <CardDescription className="mt-2">
        Once jobs, invoices, and technician schedules are active, dashboard insights will appear here.
      </CardDescription>
    </Card>
  );
}

