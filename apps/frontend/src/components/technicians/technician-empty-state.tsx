import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type TechnicianEmptyStateProps = {
  hasSearch: boolean;
};

export function TechnicianEmptyState({ hasSearch }: TechnicianEmptyStateProps) {
  return (
    <Card>
      <CardTitle>{hasSearch ? "No matching technicians" : "No technicians yet"}</CardTitle>
      <CardDescription className="mt-2">
        {hasSearch
          ? "Try changing your search or filter criteria."
          : "Create technician profiles to manage assignments and availability."}
      </CardDescription>
    </Card>
  );
}

