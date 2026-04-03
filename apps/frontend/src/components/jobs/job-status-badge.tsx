import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/api";

type JobStatusBadgeProps = {
  status: JobStatus;
};

const statusStyles: Record<JobStatus, string> = {
  NEW: "border-slate-500/40 bg-slate-900/40 text-slate-300",
  SCHEDULED: "border-blue-500/40 bg-blue-950/20 text-blue-300",
  IN_PROGRESS: "border-amber-500/40 bg-amber-950/20 text-amber-300",
  COMPLETED: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300",
  INVOICED: "border-violet-500/40 bg-violet-950/20 text-violet-300",
  CANCELLED: "border-rose-500/40 bg-rose-950/20 text-rose-300"
};

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

