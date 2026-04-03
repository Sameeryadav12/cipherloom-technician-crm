import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type AddonDeleteDialogProps = {
  open: boolean;
  addonName?: string;
  isDeleting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export function AddonDeleteDialog({
  open,
  addonName,
  isDeleting = false,
  error,
  onCancel,
  onConfirm
}: AddonDeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-sm">
        <CardTitle>Delete add-on</CardTitle>
        <CardDescription className="mt-2">
          {addonName ? `Remove "${addonName}"?` : "Remove this add-on?"}
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
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
