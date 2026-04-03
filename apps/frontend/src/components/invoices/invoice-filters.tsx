import { Button } from "@/components/ui/button";
import type { InvoiceStatus, Customer } from "@/types/api";

type InvoiceFiltersValue = {
  status: InvoiceStatus | "";
  customerId: string;
  issuedAtFrom: string;
  issuedAtTo: string;
};

type InvoiceFiltersProps = {
  value: InvoiceFiltersValue;
  customers: Customer[];
  onChange: (value: InvoiceFiltersValue) => void;
  onReset: () => void;
};

const statusOptions: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"];

export function InvoiceFilters({ value, customers, onChange, onReset }: InvoiceFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-5">
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        value={value.status}
        onChange={(event) =>
          onChange({
            ...value,
            status: event.target.value as InvoiceStatus | ""
          })
        }
      >
        <option value="">All statuses</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        value={value.customerId}
        onChange={(event) => onChange({ ...value, customerId: event.target.value })}
      >
        <option value="">All customers</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>

      <input
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        type="date"
        value={value.issuedAtFrom}
        onChange={(event) => onChange({ ...value, issuedAtFrom: event.target.value })}
      />
      <input
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        type="date"
        value={value.issuedAtTo}
        onChange={(event) => onChange({ ...value, issuedAtTo: event.target.value })}
      />

      <Button variant="outline" onClick={onReset}>
        Reset Filters
      </Button>
    </div>
  );
}

