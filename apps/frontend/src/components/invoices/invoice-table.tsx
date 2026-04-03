import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatShortDate, isDueWithinDays, isOverdueDueDate } from "@/lib/format-datetime";
import { InvoiceRowActions } from "./invoice-row-actions";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import type { InvoiceListItem } from "@/types/invoices";

type InvoiceTableProps = {
  items: InvoiceListItem[];
  onUpdate: (invoice: InvoiceListItem) => void;
  onDelete: (invoice: InvoiceListItem) => void;
};

function formatMoney(value: string) {
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(number);
}

export function InvoiceTable({ items, onUpdate, onDelete }: InvoiceTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/30 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
          <tr>
            <th className="px-4 py-3">Invoice</th>
            <th className="px-4 py-3">Job</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Issued</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((invoice) => {
            const overdue =
              invoice.status === "OVERDUE" || isOverdueDueDate(invoice.dueAt, invoice.status);
            const dueSoon =
              !overdue && isDueWithinDays(5, invoice.dueAt, invoice.status) && invoice.status !== "PAID";

            return (
              <tr
                key={invoice.id}
                className={cn(
                  "border-t border-border/60 transition-colors hover:bg-primary/[0.05]",
                  overdue && "bg-red-950/15",
                  dueSoon && !overdue && "bg-amber-950/10"
                )}
              >
                <td className="px-4 py-3 align-top font-mono text-xs">
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {invoice.id.slice(0, 10)}…
                  </Link>
                </td>
                <td className="px-4 py-3 align-top">{invoice.job?.title ?? "—"}</td>
                <td className="px-4 py-3 align-top text-muted-foreground">
                  {invoice.job?.customer?.name ?? "—"}
                </td>
                <td className="px-4 py-3 align-top tabular-nums font-medium">{formatMoney(invoice.total)}</td>
                <td className="px-4 py-3 align-top">
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">
                  {formatShortDate(invoice.issuedAt)}
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={cn(
                      overdue && "font-medium text-red-300",
                      dueSoon && !overdue && "text-amber-200"
                    )}
                  >
                    {formatShortDate(invoice.dueAt)}
                  </span>
                  {dueSoon ? (
                    <span className="ml-1 text-[10px] uppercase tracking-wide text-amber-400/90">
                      Soon
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top">
                  <InvoiceRowActions invoice={invoice} onUpdate={onUpdate} onDelete={onDelete} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
