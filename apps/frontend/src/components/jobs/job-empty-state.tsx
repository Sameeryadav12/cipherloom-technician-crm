import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type JobEmptyStateProps = {
  hasFilters: boolean;
};

export function JobEmptyState({ hasFilters }: JobEmptyStateProps) {
  return (
    <Card>
      <CardTitle>{hasFilters ? "No matching jobs" : "No jobs yet"}</CardTitle>
      <CardDescription className="mt-2">
        {hasFilters
          ? "Adjust the filters and try again."
          : "Create your first job to start planning work orders and assignments."}
      </CardDescription>
    </Card>
  );
}

