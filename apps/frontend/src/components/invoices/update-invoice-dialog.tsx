import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import type { InvoiceStatus } from "@/types/api";
import type { UpdateInvoiceValues } from "@/types/invoices";

type UpdateInvoiceDialogProps = {
  open: boolean;
  initialValues: UpdateInvoiceValues;
  currentStatus: InvoiceStatus;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: UpdateInvoiceValues) => Promise<void> | void;
};

const statuses: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"];

export function UpdateInvoiceDialog({
  open,
  initialValues,
  currentStatus,
  isSubmitting = false,
  error,
  onClose,
  onSubmit
}: UpdateInvoiceDialogProps) {
  const [values, setValues] = useState<UpdateInvoiceValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setSubmitted(false);
    }
  }, [initialValues, open]);

  const validationError = useMemo(() => {
    const discount = values.discount.trim();
    if (discount) {
      const parsed = Number(discount);
      if (Number.isNaN(parsed) || parsed < 0) return "Discount must be a non-negative number.";
    }
    if (values.dueAt) {
      const date = new Date(values.dueAt);
      if (Number.isNaN(date.getTime())) return "Due date must be valid.";
      if (date.getTime() <= Date.now()) return "Due date should be in the future.";
    }
    return null;
  }, [values.discount, values.dueAt]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (validationError) return;
    await onSubmit({
      status: values.status,
      discount: values.discount.trim(),
      notes: values.notes.trim(),
      dueAt: values.dueAt
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-xl">
        <CardTitle>Update Invoice</CardTitle>
        <CardDescription className="mt-2 flex items-center gap-2">
          Current: <InvoiceStatusBadge status={currentStatus} />
        </CardDescription>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={values.status}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, status: e.target.value as InvoiceStatus }))
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Discount</label>
            <Input
              value={values.discount}
              onChange={(e) => setValues((prev) => ({ ...prev, discount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="datetime-local"
              value={values.dueAt}
              onChange={(e) => setValues((prev) => ({ ...prev, dueAt: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={values.notes}
              onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {submitted && validationError ? (
            <p className="text-xs text-red-400">{validationError}</p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

