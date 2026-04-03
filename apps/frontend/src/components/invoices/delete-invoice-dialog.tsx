import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type DeleteInvoiceDialogProps = {
  open: boolean;
  invoiceId?: string;
  isDeleting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export function DeleteInvoiceDialog({
  open,
  invoiceId,
  isDeleting = false,
  error,
  onCancel,
  onConfirm
}: DeleteInvoiceDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md">
        <CardTitle>Delete invoice</CardTitle>
        <CardDescription className="mt-2">
          {invoiceId ? `Are you sure you want to delete invoice ${invoiceId}?` : "Are you sure?"}
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

