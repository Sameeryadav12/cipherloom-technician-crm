import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { TechnicianListItem } from "@/types/technicians";

type AssignTechnicianDialogProps = {
  open: boolean;
  technicians: TechnicianListItem[];
  currentTechnicianName?: string;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (technicianId: string) => Promise<void> | void;
};

export function AssignTechnicianDialog({
  open,
  technicians,
  currentTechnicianName,
  isSubmitting = false,
  error,
  onClose,
  onSubmit
}: AssignTechnicianDialogProps) {
  const [technicianId, setTechnicianId] = useState("");

  useEffect(() => {
    if (open) setTechnicianId("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-lg">
        <CardTitle>Assign Technician</CardTitle>
        <CardDescription className="mt-2">
          Current technician: {currentTechnicianName ?? "Unassigned"}
        </CardDescription>
        <div className="mt-4 space-y-1">
          <label className="text-sm font-medium">Technician</label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
          >
            <option value="">Select technician</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.name}
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
          <Button
            disabled={isSubmitting || !technicianId}
            onClick={() => void onSubmit(technicianId)}
          >
            {isSubmitting ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

