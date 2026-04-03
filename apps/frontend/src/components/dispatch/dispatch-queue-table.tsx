import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DispatchQueueItem } from "@/types/dispatch";

type DispatchQueueTableProps = {
  items: DispatchQueueItem[];
  onReschedule: (item: DispatchQueueItem) => void;
  onAssign: (item: DispatchQueueItem) => void;
};

export function DispatchQueueTable({ items, onReschedule, onAssign }: DispatchQueueTableProps) {
  if (!items.length) {
    return (
      <Card className="border-border/70 bg-card/40">
        <p className="text-sm text-muted-foreground">No jobs currently require action in this queue.</p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/30">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/80 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Job</th>
            <th className="px-4 py-3">Routing</th>
            <th className="px-4 py-3">Queue reason</th>
            <th className="px-4 py-3">Assignment</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.job.id} className="border-t border-border/60 align-top">
              <td className="px-4 py-3">
                <Link className="font-semibold hover:text-primary hover:underline" to={`/jobs/${item.job.id}`}>
                  {item.job.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status: {item.job.status.replace("_", " ")} {item.ageHours > 48 ? `• ${Math.floor(item.ageHours)}h old` : ""}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <p>{item.job.customer?.name ?? "Unknown customer"}</p>
                <p className="text-xs">{item.job.technician?.name ?? "Unassigned"}</p>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {item.reasons.map((reason) => (
                    <span key={reason.code} className="rounded-full border border-amber-500/35 bg-amber-950/25 px-2 py-0.5 text-[10px] text-amber-100">
                      {reason.label}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-border/70 px-2 py-1 text-[10px]">
                  {item.assignmentState.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Button variant="outline" className="h-8 text-xs" onClick={() => onAssign(item)}>
                    Assign
                  </Button>
                  <Button variant="outline" className="h-8 text-xs" onClick={() => onReschedule(item)}>
                    Reschedule
                  </Button>
                  <Link
                    to="/scheduling"
                    state={{
                      prefillCustomerId: item.job.customerId,
                      prefillTitle: item.job.title,
                      prefillIgnoreJobId: item.job.id
                    }}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-muted"
                  >
                    Smart schedule
                  </Link>
                  {item.job.status === "COMPLETED" ? (
                    <Link to="/invoices" className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-muted">
                      Invoice
                    </Link>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
