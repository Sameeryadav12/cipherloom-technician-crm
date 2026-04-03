import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { cn } from "@/lib/utils";
import type { CalendarEventItem } from "@/types/calendar";
import type { JobStatus } from "@/types/api";
import type { RescheduleJobContext } from "@/types/dispatch";

type CalendarEventDetailSheetProps = {
  open: boolean;
  item: CalendarEventItem | null;
  onClose: () => void;
  onRescheduleJob: (context: RescheduleJobContext) => void;
};

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${start} – ${end}`;
  return `${s.toLocaleString()} → ${e.toLocaleString()}`;
}

const linkOutline =
  "inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const linkPrimary =
  "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function isJobStatus(value: string | undefined): value is JobStatus {
  return (
    value === "NEW" ||
    value === "SCHEDULED" ||
    value === "IN_PROGRESS" ||
    value === "COMPLETED" ||
    value === "INVOICED" ||
    value === "CANCELLED"
  );
}

export function CalendarEventDetailSheet({ open, item, onClose, onRescheduleJob }: CalendarEventDetailSheetProps) {
  const navigate = useNavigate();

  if (!open || !item) return null;

  const backdrop = (
    <button
      type="button"
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]"
      aria-label="Close panel"
      onClick={onClose}
    />
  );

  if (item.type === "time_off") {
    const reason = typeof item.meta["reason"] === "string" ? item.meta["reason"] : null;
    const timeOffId = typeof item.meta["timeOffId"] === "string" ? item.meta["timeOffId"] : null;
    return (
      <>
        {backdrop}
        <aside
          className={cn(
            "fixed right-0 top-0 z-[110] flex h-full w-full max-w-md flex-col border-l border-border/80",
            "bg-card shadow-2xl"
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border/80 bg-gradient-to-r from-violet-950/40 to-transparent px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/80">Leave</p>
              <h2 className="text-lg font-semibold tracking-tight">Time off</h2>
              <p className="text-sm text-muted-foreground">{item.technicianName}</p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-border/80 p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Window</dt>
                <dd className="mt-1">{formatRange(item.start, item.end)}</dd>
              </div>
              {reason?.trim() ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reason</dt>
                  <dd className="mt-1">{reason.trim()}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-6 text-xs text-muted-foreground">
              Edit or remove leave from the technician profile. Reschedule affected jobs from the Jobs board if
              coverage conflicts.
            </p>
          </div>
          <div className="border-t border-border/80 p-4">
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/technicians/${item.technicianId}#time-off`}
                onClick={onClose}
                className={cn(linkOutline, "flex-1 text-center")}
              >
                Manage leave
              </Link>
              <Link to="/jobs" onClick={onClose} className={cn(linkOutline, "flex-1 text-center")}>
                Jobs board
              </Link>
            </div>
            {timeOffId ? (
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                Entry ID: {timeOffId.length > 14 ? `${timeOffId.slice(0, 12)}…` : timeOffId}
              </p>
            ) : null}
          </div>
        </aside>
      </>
    );
  }

  const jobId = typeof item.meta["jobId"] === "string" ? item.meta["jobId"] : null;
  const customerName = typeof item.meta["customerName"] === "string" ? item.meta["customerName"] : null;
  const status = isJobStatus(item.status) ? item.status : undefined;
  const unassigned = !item.technicianId || item.technicianName === "Unassigned";
  const invoiceReady = status === "COMPLETED";
  const assignmentState = unassigned ? "Unassigned" : status === "SCHEDULED" ? "Pending confirmation" : "Assigned";

  return (
    <>
      {backdrop}
      <aside
        className={cn(
          "fixed right-0 top-0 z-[110] flex h-full w-full max-w-md flex-col border-l border-border/80",
          "bg-card shadow-2xl"
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/80 bg-gradient-to-r from-primary/15 to-transparent px-5 py-4">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/90">Job</p>
            <h2 className="break-words text-lg font-semibold tracking-tight">{item.title}</h2>
            {status ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <JobStatusBadge status={status} />
                {unassigned ? (
                  <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                    Unassigned
                  </span>
                ) : null}
                {invoiceReady ? (
                  <span className="rounded-full border border-emerald-500/35 bg-emerald-950/25 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                    Invoice-ready
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-border/80 p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</dt>
              <dd className="mt-1 font-medium">{customerName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Technician</dt>
              <dd className="mt-1">{item.technicianName}</dd>
              <p className="mt-1 text-[11px] text-muted-foreground">Dispatch state: {assignmentState}</p>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Schedule</dt>
              <dd className="mt-1">{formatRange(item.start, item.end)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-2 border-t border-border/80 p-4">
          <p className="text-[11px] text-muted-foreground">Operational actions</p>
          <div className="flex flex-col gap-2">
            {jobId ? (
              <>
                <Link to={`/jobs/${jobId}`} onClick={onClose} className={cn(linkPrimary, "w-full")}>
                  Open job detail
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const customerId = typeof item.meta["customerId"] === "string" ? item.meta["customerId"] : "";
                      if (!customerId) return;
                      onRescheduleJob({
                        jobId,
                        title: item.title,
                        customerId,
                        customerName,
                        technicianId: item.technicianId,
                        technicianName: item.technicianName,
                        scheduledStart: item.start,
                        scheduledEnd: item.end,
                        status
                      });
                      onClose();
                    }}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      onClose();
                      navigate(`/jobs/${jobId}`);
                    }}
                  >
                    Assign / status
                  </Button>
                </div>
                {invoiceReady ? (
                  <Link to="/invoices" onClick={onClose} className={cn(linkOutline, "w-full text-xs")}>
                    Generate invoice
                  </Link>
                ) : null}
                <Link
                  to="/scheduling"
                  state={{
                    prefillCustomerId: typeof item.meta["customerId"] === "string" ? item.meta["customerId"] : undefined,
                    prefillTitle: item.title,
                    prefillIgnoreJobId: jobId
                  }}
                  onClick={onClose}
                  className={cn(linkOutline, "w-full text-xs")}
                >
                  Smart schedule this job
                </Link>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Missing job reference — open from Jobs list.</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
