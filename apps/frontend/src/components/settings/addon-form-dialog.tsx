import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ServiceAddonFormValues, ServiceAddonPayload } from "@/types/settings";

type AddonFormDialogProps = {
  open: boolean;
  title: string;
  description: string;
  initialValues: ServiceAddonFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (payload: ServiceAddonPayload) => Promise<void> | void;
};

export function AddonFormDialog({
  open,
  title,
  description,
  initialValues,
  submitLabel,
  isSubmitting = false,
  serverError,
  onClose,
  onSubmit
}: AddonFormDialogProps) {
  const [values, setValues] = useState<ServiceAddonFormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setSubmitted(false);
    }
  }, [initialValues, open]);

  const error = useMemo(() => {
    const name = values.name.trim();
    if (name.length < 2 || name.length > 120) return "Name must be between 2 and 120 characters.";
    const price = Number(values.price);
    if (Number.isNaN(price) || price < 0) return "Price must be a number ≥ 0.";
    return null;
  }, [values.name, values.price]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (error) return;
    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      price: Number(values.price),
      isActive: values.isActive
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]">
      <Card className="w-full max-w-md border-border/80 shadow-2xl">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="mt-2 leading-relaxed">{description}</CardDescription>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={values.name}
              placeholder="e.g. After-hours surcharge"
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description (optional)</label>
            <Input
              value={values.description}
              placeholder="Shown to dispatchers when attaching to a job"
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Price</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="pl-7"
                value={values.price}
                onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Adds to invoice subtotal when selected on a job using this pricing rule.
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={values.isActive}
              onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))}
            />
            <span>
              <span className="font-medium">Active</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Inactive add-ons stay in the catalog but are hidden from most pickers.
              </span>
            </span>
          </label>
          {submitted && error ? <p className="text-xs text-red-400">{error}</p> : null}
          {serverError ? (
            <p className="rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-300">
              {serverError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
