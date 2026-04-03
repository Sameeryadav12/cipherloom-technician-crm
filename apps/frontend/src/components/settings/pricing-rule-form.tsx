import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PricingRuleFormValues, PricingRulePayload } from "@/types/settings";

type PricingRuleFormProps = {
  initialValues: PricingRuleFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onSubmit: (values: PricingRulePayload) => Promise<void> | void;
  onCancel?: () => void;
};

type FieldErrors = Partial<Record<keyof PricingRuleFormValues, string>>;

function parseMoney(value: string): number | null {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export function PricingRuleForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  serverError,
  onSubmit,
  onCancel
}: PricingRuleFormProps) {
  const [values, setValues] = useState<PricingRuleFormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setSubmitted(false);
  }, [initialValues]);

  const errors = useMemo<FieldErrors>(() => {
    const next: FieldErrors = {};
    const name = values.name.trim();
    if (name.length < 2 || name.length > 120) {
      next.name = "Name must be between 2 and 120 characters.";
    }
    const base = parseMoney(values.baseCalloutFee);
    if (base === null) next.baseCalloutFee = "Base callout fee must be a number ≥ 0.";
    const rate = parseMoney(values.blockRate);
    if (rate === null) next.blockRate = "Block rate must be a number ≥ 0.";
    const mins = Number(values.blockMinutes);
    if (!Number.isInteger(mins) || mins < 1 || mins > 1440) {
      next.blockMinutes = "Block minutes must be an integer from 1 to 1440.";
    }
    return next;
  }, [values]);

  const setField = <K extends keyof PricingRuleFormValues>(key: K, value: PricingRuleFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    const base = parseMoney(values.baseCalloutFee)!;
    const rate = parseMoney(values.blockRate)!;
    const blockMinutes = Number(values.blockMinutes);

    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      baseCalloutFee: base,
      blockMinutes,
      blockRate: rate,
      isDefault: values.isDefault,
      isActive: values.isActive
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">Name</label>
        <Input value={values.name} onChange={(e) => setField("name", e.target.value)} />
        {submitted && errors.name ? <p className="text-xs text-red-400">{errors.name}</p> : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Description (optional)</label>
        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
        />
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fees & labor blocks</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Currency uses your org defaults. Call-out is typically a flat arrival fee; blocks bill time in increments.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Base callout fee</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="pl-7"
                value={values.baseCalloutFee}
                onChange={(e) => setField("baseCalloutFee", e.target.value)}
              />
            </div>
            {submitted && errors.baseCalloutFee ? (
              <p className="text-xs text-red-400">{errors.baseCalloutFee}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Applied once per job visit before labor blocks.</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Block minutes</label>
            <Input
              type="number"
              min={1}
              max={1440}
              step="1"
              value={values.blockMinutes}
              onChange={(e) => setField("blockMinutes", e.target.value)}
            />
            {submitted && errors.blockMinutes ? (
              <p className="text-xs text-red-400">{errors.blockMinutes}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Billable time rounds up to this increment.</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Block rate</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="pl-7"
                value={values.blockRate}
                onChange={(e) => setField("blockRate", e.target.value)}
              />
            </div>
            {submitted && errors.blockRate ? (
              <p className="text-xs text-red-400">{errors.blockRate}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Price per block (not per minute).</p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-3 rounded-lg border border-border/70 bg-card/40 p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={values.isDefault}
            onChange={(e) => setField("isDefault", e.target.checked)}
          />
          <span>
            <span className="font-medium">Default pricing rule</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              New jobs can inherit this rule automatically. Only one default should be active — saving may unset the
              previous default.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={values.isActive}
            onChange={(e) => setField("isActive", e.target.checked)}
          />
          <span>
            <span className="font-medium">Active</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Inactive rules stay in the system for history but are hidden from most selection lists.
            </span>
          </span>
        </label>
      </div>
      {serverError ? (
        <p className="rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-300">
          {serverError}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
