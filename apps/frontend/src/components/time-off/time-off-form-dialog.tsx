import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TimeOffFormValues } from "@/types/time-off";

const REASON_PRESETS = ["Annual leave", "Sick leave", "Training", "Unavailable", "Personal"];

type TimeOffFormDialogProps = {
  open: boolean;
  title: string;
  description: string;
  initialValues: TimeOffFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (values: TimeOffFormValues) => Promise<void> | void;
};

export function TimeOffFormDialog({
  open,
  title,
  description,
  initialValues,
  submitLabel,
  isSubmitting = false,
  serverError,
  onClose,
  onSubmit
}: TimeOffFormDialogProps) {
  const [values, setValues] = useState<TimeOffFormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(initialValues);
    setSubmitted(false);
  }, [open, initialValues]);

  const error = useMemo(() => {
    if (!values.start) return "Start date/time is required.";
    if (!values.end) return "End date/time is required.";
    if (new Date(values.end).getTime() <= new Date(values.start).getTime()) {
      return "End date/time must be later than start.";
    }
    return null;
  }, [values.end, values.start]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (error) return;
    await onSubmit({
      start: values.start,
      end: values.end,
      reason: values.reason.trim()
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-xl">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Start</label>
              <Input
                type="datetime-local"
                value={values.start}
                onChange={(e) => setValues((prev) => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">End</label>
              <Input
                type="datetime-local"
                value={values.end}
                onChange={(e) => setValues((prev) => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <div className="flex flex-wrap gap-2">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                  onClick={() => setValues((prev) => ({ ...prev, reason: preset }))}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Input
              value={values.reason}
              onChange={(e) => setValues((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Or describe the leave…"
            />
            <p className="text-xs text-muted-foreground">
              Clear labels help dispatch spot coverage gaps on the calendar.
            </p>
          </div>

          {submitted && error ? <p className="text-xs text-red-400">{error}</p> : null}
          {serverError ? (
            <p className="rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-300">
              {serverError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

