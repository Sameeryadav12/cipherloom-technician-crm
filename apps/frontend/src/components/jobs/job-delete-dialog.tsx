import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type JobDeleteDialogProps = {
  open: boolean;
  jobTitle?: string;
  isDeleting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export function JobDeleteDialog({
  open,
  jobTitle,
  isDeleting = false,
  error,
  onCancel,
  onConfirm
}: JobDeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md">
        <CardTitle>Delete job</CardTitle>
        <CardDescription className="mt-2">
          {jobTitle ? `Are you sure you want to delete "${jobTitle}"?` : "Are you sure?"}
        </CardDescription>
        {error ? (
          <p className="mt-3 rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={() => void onConfirm()} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

