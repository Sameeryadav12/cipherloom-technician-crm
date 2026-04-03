import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "./job-status-badge";
import type { JobStatus } from "@/types/api";

type UpdateJobStatusDialogProps = {
  open: boolean;
  currentStatus: JobStatus;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (status: JobStatus) => Promise<void> | void;
};

const statusOptions: JobStatus[] = [
  "NEW",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICED",
  "CANCELLED"
];

export function UpdateJobStatusDialog({
  open,
  currentStatus,
  isSubmitting = false,
  error,
  onClose,
  onSubmit
}: UpdateJobStatusDialogProps) {
  const [status, setStatus] = useState<JobStatus>(currentStatus);

  useEffect(() => {
    if (open) setStatus(currentStatus);
  }, [currentStatus, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-lg">
        <CardTitle>Update Job Status</CardTitle>
        <CardDescription className="mt-2 flex items-center gap-2">
          Current: <JobStatusBadge status={currentStatus} />
        </CardDescription>
        <div className="mt-4 space-y-1">
          <label className="text-sm font-medium">New status</label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p className="mt-3 rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button disabled={isSubmitting} onClick={() => void onSubmit(status)}>
            {isSubmitting ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

