import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/api";

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: "border-slate-500/40 bg-slate-900/40 text-slate-300",
  SENT: "border-blue-500/40 bg-blue-950/20 text-blue-300",
  PAID: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300",
  OVERDUE: "border-amber-500/40 bg-amber-950/20 text-amber-300",
  VOID: "border-rose-500/40 bg-rose-950/20 text-rose-300"
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}

