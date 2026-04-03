import { useMemo } from "react";
import { AlertCircle, Banknote, CalendarCheck, Sparkles, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobListItem } from "@/types/jobs";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function JobSignals({ job }: { job: JobListItem }) {
  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; className: string; icon: typeof Sparkles }> = [];
    if (!job.technicianId && job.status !== "CANCELLED" && job.status !== "INVOICED") {
      out.push({
        key: "unassigned",
        label: "Unassigned",
        className: "border-amber-500/35 bg-amber-500/10 text-amber-200",
        icon: UserX
      });
    }
    if (!job.pricingRuleId && job.status !== "CANCELLED" && job.status !== "INVOICED") {
      out.push({
        key: "pricing",
        label: "No pricing",
        className: "border-slate-500/35 bg-slate-500/10 text-slate-300",
        icon: Banknote
      });
    }
    if (job.scheduledStart) {
      const t = new Date(job.scheduledStart).getTime();
      if (!Number.isNaN(t) && t >= startOfToday() && t <= endOfToday()) {
        out.push({
          key: "today",
          label: "Today",
          className: "border-blue-500/35 bg-blue-500/10 text-blue-200",
          icon: CalendarCheck
        });
      }
    }
    if (job.status === "COMPLETED") {
      out.push({
        key: "invoice",
        label: "Invoice-ready",
        className: "border-emerald-500/35 bg-emerald-500/10 text-emerald-200",
        icon: Sparkles
      });
    }
    const created = new Date(job.createdAt).getTime();
    const day = 86400000;
    if (!Number.isNaN(created) && Date.now() - created > 7 * day && job.status === "NEW") {
      out.push({
        key: "stale",
        label: "Stale",
        className: "border-rose-500/30 bg-rose-500/10 text-rose-200",
        icon: AlertCircle
      });
    }
    return out.slice(0, 3);
  }, [job]);

  if (chips.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {chips.map(({ key, label, className, icon: Icon }) => (
        <span
          key={key}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            className
          )}
        >
          <Icon className="h-3 w-3 opacity-90" />
          {label}
        </span>
      ))}
    </div>
  );
}
