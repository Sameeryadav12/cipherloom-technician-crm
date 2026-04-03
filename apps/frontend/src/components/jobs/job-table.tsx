import { Link } from "react-router-dom";
import { JobRowActions } from "./job-row-actions";
import { JobSignals } from "./job-signals";
import { JobStatusBadge } from "./job-status-badge";
import type { JobListItem } from "@/types/jobs";
import { cn } from "@/lib/utils";

type JobTableProps = {
  items: JobListItem[];
  onEdit: (job: JobListItem) => void;
  onDelete: (job: JobListItem) => void;
  onAssignTechnician: (job: JobListItem) => void;
  onUpdateStatus: (job: JobListItem) => void;
  onReschedule: (job: JobListItem) => void;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function JobTable({
  items,
  onEdit,
  onDelete,
  onAssignTechnician,
  onUpdateStatus,
  onReschedule
}: JobTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-hidden rounded-xl border border-border/80",
        "bg-card/30 shadow-surface ring-1 ring-white/[0.03]"
      )}
    >
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
          <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3.5">Work order</th>
            <th className="px-4 py-3.5">Routing</th>
            <th className="hidden px-4 py-3.5 lg:table-cell">Status</th>
            <th className="hidden px-4 py-3.5 xl:table-cell">Schedule</th>
            <th className="hidden px-4 py-3.5 lg:table-cell">Created</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((job) => (
            <tr
              key={job.id}
              className={cn(
                "group border-t border-border/60 transition-colors",
                "hover:bg-primary/[0.06]"
              )}
            >
              <td className="px-4 py-3 align-top">
                <Link
                  to={`/jobs/${job.id}`}
                  className="font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {job.title}
                </Link>
                <JobSignals job={job} />
              </td>
              <td className="px-4 py-3 align-top text-muted-foreground">
                <p>{job.customer?.name ?? "—"}</p>
                <p className="mt-0.5 text-xs">{job.technician?.name ?? "Unassigned"}</p>
                <div className="mt-2 lg:hidden">
                  <JobStatusBadge status={job.status} />
                </div>
              </td>
              <td className="hidden px-4 py-3 align-top lg:table-cell">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="hidden px-4 py-3 align-top text-muted-foreground xl:table-cell">
                <p className="text-foreground/90">{formatDateTime(job.scheduledStart)}</p>
                <p className="text-xs">→ {formatDateTime(job.scheduledEnd)}</p>
              </td>
              <td className="hidden px-4 py-3 align-top text-muted-foreground lg:table-cell">
                {formatDate(job.createdAt)}
              </td>
              <td className="px-4 py-3 align-top">
                <JobRowActions
                  job={job}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAssign={onAssignTechnician}
                  onStatus={onUpdateStatus}
                  onReschedule={onReschedule}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
