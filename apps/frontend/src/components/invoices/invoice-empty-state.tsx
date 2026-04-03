import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type InvoiceEmptyStateProps = {
  hasFilters: boolean;
};

export function InvoiceEmptyState({ hasFilters }: InvoiceEmptyStateProps) {
  return (
    <Card>
      <CardTitle>{hasFilters ? "No matching invoices" : "No invoices yet"}</CardTitle>
      <CardDescription className="mt-2">
        {hasFilters
          ? "Adjust filters and try again."
          : "Generate invoices from completed jobs to start billing workflows."}
      </CardDescription>
    </Card>
  );
}

