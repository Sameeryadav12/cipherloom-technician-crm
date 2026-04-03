import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatShortDateTime } from "@/lib/format-datetime";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import type { InvoiceDetail } from "@/types/invoices";

type InvoiceDetailCardProps = {
  invoice: InvoiceDetail;
};

function formatMoney(value: string) {
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(number);
}

export function InvoiceDetailCard({ invoice }: InvoiceDetailCardProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Invoice
            </p>
            <CardTitle className="mt-1 font-mono text-lg tracking-tight">
              {invoice.id.slice(0, 14)}…
            </CardTitle>
            <CardDescription className="mt-2 max-w-xl">
              Billing document tied to a single job. Status drives collections workflow.
            </CardDescription>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Total due</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
              {formatMoney(invoice.total)}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Issued</span>
              <span>{formatShortDateTime(invoice.issuedAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Due</span>
              <span>{formatShortDateTime(invoice.dueAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Paid</span>
              <span>{formatShortDateTime(invoice.paidAt)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle className="text-base">Job & customer</CardTitle>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Job</dt>
            <dd className="mt-1 font-medium">{invoice.job?.title ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Bill to</dt>
            <dd className="mt-1">{invoice.job?.customer?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pricing rule</dt>
            <dd className="mt-1">{invoice.pricingRule?.name ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="lg:col-span-3">
        <CardTitle className="text-base">Line economics</CardTitle>
        <CardDescription className="mt-1">Amounts stored on the invoice record.</CardDescription>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="mt-1 tabular-nums">{formatMoney(invoice.subtotal)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="mt-1 tabular-nums">{formatMoney(invoice.tax)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="mt-1 tabular-nums">{formatMoney(invoice.discount)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Updated</dt>
            <dd className="mt-1">{formatShortDateTime(invoice.updatedAt)}</dd>
          </div>
          <div className="sm:col-span-2 md:col-span-4">
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="mt-1 text-muted-foreground">{invoice.notes?.trim() || "—"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
