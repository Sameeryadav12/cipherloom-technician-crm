import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Customer, Technician } from "@/types/api";
import type { JobFormValues, PricingRuleListItem } from "@/types/jobs";

type JobFormProps = {
  initialValues: JobFormValues;
  customers: Customer[];
  technicians: Technician[];
  pricingRules: PricingRuleListItem[];
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onSubmit: (values: JobFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

type FieldErrors = Partial<Record<keyof JobFormValues, string>>;

export function JobForm({
  initialValues,
  customers,
  technicians,
  pricingRules,
  submitLabel,
  isSubmitting = false,
  serverError,
  onSubmit,
  onCancel
}: JobFormProps) {
  const navigate = useNavigate();
  const [values, setValues] = useState<JobFormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setSubmitted(false);
  }, [initialValues]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === values.customerId),
    [customers, values.customerId]
  );
  const selectedRule = useMemo(
    () => pricingRules.find((r) => r.id === values.pricingRuleId),
    [pricingRules, values.pricingRuleId]
  );
  const selectedTech = useMemo(
    () => technicians.find((t) => t.id === values.technicianId),
    [technicians, values.technicianId]
  );

  const errors = useMemo<FieldErrors>(() => {
    const next: FieldErrors = {};
    const title = values.title.trim();
    if (title.length < 3 || title.length > 150) {
      next.title = "Title must be between 3 and 150 characters.";
    }
    if (!values.customerId) next.customerId = "Customer is required.";
    const hasStart = Boolean(values.scheduledStart);
    const hasEnd = Boolean(values.scheduledEnd);
    if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
      next.scheduledEnd = "Provide both scheduled start and end, or leave both empty.";
    }
    if (hasStart && hasEnd) {
      const start = new Date(values.scheduledStart).getTime();
      const end = new Date(values.scheduledEnd).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
        next.scheduledEnd = "Scheduled end must be later than scheduled start.";
      }
    }
    return next;
  }, [values]);

  const setField = <K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    await onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim()
    });
  };

  const openSmartSchedule = () => {
    navigate("/scheduling", {
      state: {
        prefillCustomerId: values.customerId || undefined,
        prefillTitle: values.title.trim() || undefined
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:gap-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Smart Scheduling</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Rank technicians and slots with skills, travel, and availability — without leaving your
                workflow context.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-primary/40 bg-background/50 font-medium text-primary"
              onClick={openSmartSchedule}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Open assistant
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Job details</h3>
          <p className="text-xs text-muted-foreground">What the crew needs to execute on-site.</p>
          <div className="mt-3 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                className="h-11 border-border/90"
                value={values.title}
                onChange={(e) => setField("title", e.target.value)}
              />
              {submitted && errors.title ? <p className="text-xs text-red-400">{errors.title}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <select
                  className="h-11 w-full rounded-md border border-border/90 bg-background/70 px-3 text-sm"
                  value={values.customerId}
                  onChange={(e) => setField("customerId", e.target.value)}
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {submitted && errors.customerId ? (
                  <p className="text-xs text-red-400">{errors.customerId}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Technician</label>
                <select
                  className="h-11 w-full rounded-md border border-border/90 bg-background/70 px-3 text-sm"
                  value={values.technicianId}
                  onChange={(e) => setField("technicianId", e.target.value)}
                >
                  <option value="">Unassigned — triage from queue</option>
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Assign now or use Smart Scheduling to propose the best match.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Schedule window</h3>
          <p className="text-xs text-muted-foreground">Optional — leave empty if not booked yet.</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled start</label>
              <Input
                type="datetime-local"
                className="h-11 border-border/90"
                value={values.scheduledStart}
                onChange={(e) => setField("scheduledStart", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled end</label>
              <Input
                type="datetime-local"
                className="h-11 border-border/90"
                value={values.scheduledEnd}
                onChange={(e) => setField("scheduledEnd", e.target.value)}
              />
              {submitted && errors.scheduledEnd ? (
                <p className="text-xs text-red-400">{errors.scheduledEnd}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Billing</h3>
          <div className="mt-3 space-y-2">
            <label className="text-sm font-medium">Pricing rule</label>
            <select
              className="h-11 w-full rounded-md border border-border/90 bg-background/70 px-3 text-sm"
              value={values.pricingRuleId}
              onChange={(e) => setField("pricingRuleId", e.target.value)}
            >
              <option value="">No pricing rule</option>
              {pricingRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name}
                  {rule.isDefault ? " (Default)" : ""}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Drives call-out, time blocks, and add-ons on invoices. Configure under Settings.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="min-h-28 w-full rounded-lg border border-border/90 bg-background/70 px-3 py-2 text-sm"
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>

        {serverError ? (
          <p className="rounded-lg border border-red-500/40 bg-red-950/20 p-3 text-sm text-red-300">
            {serverError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-border/80 pt-4 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button variant="ghost" type="button" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" className="font-semibold shadow-glow" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-4 space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 shadow-surface">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Customer</p>
              <p className="font-medium">{selectedCustomer?.name ?? "—"}</p>
              {selectedCustomer?.suburb ? (
                <p className="text-xs text-muted-foreground">
                  {selectedCustomer.suburb}
                  {selectedCustomer.state ? `, ${selectedCustomer.state}` : ""}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Technician</p>
              <p className="font-medium">{selectedTech?.name ?? "Unassigned"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Pricing</p>
              <p className="font-medium">{selectedRule?.name ?? "None selected"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Window</p>
              <p className="text-xs text-muted-foreground">
                {values.scheduledStart && values.scheduledEnd
                  ? "Start & end set"
                  : "Not scheduled yet"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
