import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type CustomerEmptyStateProps = {
  hasSearch: boolean;
};

export function CustomerEmptyState({ hasSearch }: CustomerEmptyStateProps) {
  return (
    <Card>
      <CardTitle>{hasSearch ? "No matching customers" : "No customers yet"}</CardTitle>
      <CardDescription className="mt-2">
        {hasSearch
          ? "Try adjusting your search terms."
          : "Create your first customer to start tracking jobs and service history."}
      </CardDescription>
    </Card>
  );
}

