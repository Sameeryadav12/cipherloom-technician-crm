import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, FileText, MoreHorizontal, Pencil, Trash2, UserPlus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobListItem } from "@/types/jobs";

type JobRowActionsProps = {
  job: JobListItem;
  onEdit: (job: JobListItem) => void;
  onDelete: (job: JobListItem) => void;
  onAssign: (job: JobListItem) => void;
  onStatus: (job: JobListItem) => void;
  onReschedule: (job: JobListItem) => void;
};

export function JobRowActions({ job, onEdit, onDelete, onAssign, onStatus, onReschedule }: JobRowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const primary =
    job.status === "NEW"
      ? job.technicianId
        ? { label: "Schedule", action: () => onEdit(job) }
        : { label: "Assign", action: () => onAssign(job) }
      : job.status === "SCHEDULED"
        ? { label: "Open", action: () => navigate(`/jobs/${job.id}`) }
        : job.status === "IN_PROGRESS"
          ? { label: "Status", action: () => onStatus(job) }
          : job.status === "COMPLETED"
            ? { label: "Invoice", action: () => navigate("/invoices") }
            : { label: "Open", action: () => navigate(`/jobs/${job.id}`) };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        type="button"
        variant="default"
        className="h-8 px-3 text-xs font-medium"
        onClick={primary.action}
      >
        {primary.label}
      </Button>

      <div className="relative" ref={ref}>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 p-0"
          aria-label="More actions"
          onClick={() => setOpen((v) => !v)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        {open ? (
          <div
            className={cn(
              "absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-border/90",
              "bg-card py-1 shadow-surface-lg"
            )}
          >
            <Link
              to={`/jobs/${job.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => setOpen(false)}
            >
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Job detail
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => {
                setOpen(false);
                onReschedule(job);
              }}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Reschedule
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => {
                setOpen(false);
                onAssign(job);
              }}
            >
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              Assign technician
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => {
                setOpen(false);
                onStatus(job);
              }}
            >
              <Workflow className="h-4 w-4 text-muted-foreground" />
              Update status
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => {
                setOpen(false);
                navigate("/scheduling");
              }}
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              Smart schedule…
            </button>
            <div className="my-1 h-px bg-border/80" />
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
              onClick={() => {
                setOpen(false);
                onDelete(job);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete job
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
