import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { Customer } from "@/types/api";

type CustomerDetailCardProps = {
  customer: Customer;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function CustomerDetailCard({ customer }: CustomerDetailCardProps) {
  return (
    <Card className="space-y-5">
      <div>
        <CardTitle>{customer.name}</CardTitle>
        <CardDescription className="mt-1">Customer profile and contact information.</CardDescription>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Info label="Email" value={customer.email} />
        <Info label="Phone" value={customer.phone} />
        <Info label="Address Line 1" value={customer.addressLine1} />
        <Info label="Address Line 2" value={customer.addressLine2} />
        <Info label="Suburb" value={customer.suburb} />
        <Info label="State" value={customer.state} />
        <Info label="Postcode" value={customer.postcode} />
        <Info label="Country" value={customer.country} />
      </div>

      <Info label="Notes" value={customer.notes} />

      <div className="grid gap-4 md:grid-cols-2">
        <Info label="Created" value={formatDate(customer.createdAt)} />
        <Info label="Updated" value={formatDate(customer.updatedAt)} />
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value && value.trim().length > 0 ? value : "-"}</p>
    </div>
  );
}

