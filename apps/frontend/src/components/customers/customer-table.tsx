import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { CustomerOpsSummary } from "@/lib/customer-ops-summary";
import { formatRelativeHint, formatShortDate } from "@/lib/format-datetime";
import { CustomerRowActions } from "./customer-row-actions";
import type { CustomerListItem } from "@/types/customers";

type CustomerTableProps = {
  items: CustomerListItem[];
  opsByCustomerId?: Map<string, CustomerOpsSummary>;
  onEdit: (customer: CustomerListItem) => void;
  onDelete: (customer: CustomerListItem) => void;
};

function locationLine(c: CustomerListItem) {
  const parts = [c.suburb, c.state, c.postcode].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  if (c.addressLine1) return c.addressLine1;
  return "—";
}

export function CustomerTable({ items, opsByCustomerId, onEdit, onDelete }: CustomerTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/30 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Work</th>
            <th className="px-4 py-3">Billing</th>
            <th className="px-4 py-3">Activity</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((customer) => {
            const ops = opsByCustomerId?.get(customer.id);
            const openJobs = ops?.openJobs ?? 0;
            const unpaid = ops?.unpaidInvoices ?? 0;
            const overdue = ops?.overdueInvoices ?? 0;
            const activity = ops?.lastActivityAt ?? customer.updatedAt ?? customer.createdAt;
            const hint = formatRelativeHint(activity);

            return (
              <tr
                key={customer.id}
                className={cn(
                  "border-t border-border/60 transition-colors",
                  "hover:bg-primary/[0.06]"
                )}
              >
                <td className="px-4 py-3 align-top">
                  <Link
                    to={`/customers/${customer.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {customer.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Since {formatShortDate(customer.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">
                  <div>{customer.email?.trim() || "—"}</div>
                  <div className="mt-0.5 text-xs">{customer.phone?.trim() || "—"}</div>
                </td>
                <td className="max-w-[200px] px-4 py-3 align-top text-muted-foreground">
                  {locationLine(customer)}
                </td>
                <td className="px-4 py-3 align-top">
                  {openJobs > 0 ? (
                    <span className="inline-flex rounded-full border border-sky-500/35 bg-sky-950/25 px-2 py-0.5 text-xs font-medium text-sky-200">
                      {openJobs} open
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {unpaid > 0 || overdue > 0 ? (
                    <div className="flex flex-col gap-1">
                      {unpaid > 0 ? (
                        <span className="inline-flex w-fit rounded-full border border-amber-500/35 bg-amber-950/20 px-2 py-0.5 text-xs text-amber-200">
                          {unpaid} unpaid
                        </span>
                      ) : null}
                      {overdue > 0 ? (
                        <span className="inline-flex w-fit rounded-full border border-red-500/40 bg-red-950/25 px-2 py-0.5 text-xs text-red-200">
                          {overdue} overdue
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Clear</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">
                  <span className="text-foreground/90">{formatShortDate(activity)}</span>
                  {hint ? <span className="ml-1 text-xs opacity-80">({hint})</span> : null}
                </td>
                <td className="px-4 py-3 align-top">
                  <CustomerRowActions customer={customer} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
