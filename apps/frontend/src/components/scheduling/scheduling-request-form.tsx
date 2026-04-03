import { useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SchedulingSkillInput } from "./scheduling-skill-input";
import type { CustomerListItem } from "@/types/customers";
import type { TechnicianListItem } from "@/types/technicians";
import type { SchedulingRequest, SchedulingRequestFormValues } from "@/types/scheduling";

type FieldErrors = Partial<Record<keyof SchedulingRequestFormValues, string>>;

const DURATION_PRESETS = [30, 60, 90, 120] as const;

function toDateTimeLocal(isoValue?: string | null) {
  if (!isoValue) return "";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoLocal(value: string) {
  return new Date(value).toISOString();
}

function validate(values: SchedulingRequestFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const title = values.title.trim();

  if (!values.customerId) errors.customerId = "Customer is required.";
  if (!title) errors.title = "Title is required.";
  if (title && title.length < 3) errors.title = "Title must be at least 3 characters.";
  if (title && title.length > 150) errors.title = "Title must be 150 characters or less.";

  const duration = Number(values.durationMinutes);
  if (!values.durationMinutes.trim()) {
    errors.durationMinutes = "Duration is required.";
  } else if (!Number.isFinite(duration) || !Number.isInteger(duration)) {
    errors.durationMinutes = "Duration must be a whole number of minutes.";
  } else if (duration <= 0) {
    errors.durationMinutes = "Duration must be greater than 0.";
  } else if (duration < 15) {
    errors.durationMinutes = "Duration must be at least 15 minutes.";
  } else if (duration > 8 * 60) {
    errors.durationMinutes = "Duration must be 480 minutes or less.";
  }

  const hasStart = Boolean(values.preferredStart);
  const hasEnd = Boolean(values.preferredEnd);
  if (hasStart !== hasEnd) {
    if (!hasStart) errors.preferredStart = "Start time is required when an end time is provided.";
    if (!hasEnd) errors.preferredEnd = "End time is required when a start time is provided.";
  }

  if (hasStart && hasEnd) {
    const start = new Date(values.preferredStart).getTime();
    const end = new Date(values.preferredEnd).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      errors.preferredEnd = "End must be later than start.";
    }
  }

  return errors;
}

function toPayload(values: SchedulingRequestFormValues): SchedulingRequest {
  const requiredSkills = values.requiredSkills.map((s) => s.trim()).filter(Boolean);
  const serviceAddress =
    values.serviceSuburb.trim() || values.serviceState.trim() || values.servicePostcode.trim()
      ? {
          suburb: values.serviceSuburb.trim() || undefined,
          state: values.serviceState.trim() || undefined,
          postcode: values.servicePostcode.trim() || undefined
        }
      : undefined;

  return {
    customerId: values.customerId,
    title: values.title.trim(),
    durationMinutes: Number(values.durationMinutes),
    preferredStart: values.preferredStart ? toIsoLocal(values.preferredStart) : undefined,
    preferredEnd: values.preferredEnd ? toIsoLocal(values.preferredEnd) : undefined,
    technicianId: values.technicianId || undefined,
    requiredSkills: requiredSkills.length ? requiredSkills : undefined,
    serviceAddress,
    ignoreJobId: values.ignoreJobId.trim() || undefined
  };
}

type SchedulingRequestFormProps = {
  customers: CustomerListItem[];
  technicians: TechnicianListItem[];
  isSubmitting?: boolean;
  serverError?: string | null;
  initialValues?: Partial<SchedulingRequestFormValues>;
  onSubmit: (payload: SchedulingRequest) => void | Promise<void>;
};

export function SchedulingRequestForm({
  customers,
  technicians,
  isSubmitting,
  serverError,
  initialValues,
  onSubmit
}: SchedulingRequestFormProps) {
  const customerId = useId();
  const titleId = useId();
  const durationId = useId();
  const preferredStartId = useId();
  const preferredEndId = useId();
  const technicianId = useId();
  const customerSearchId = useId();

  const [values, setValues] = useState<SchedulingRequestFormValues>({
    customerId: "",
    title: "",
    durationMinutes: "60",
    preferredStart: "",
    preferredEnd: "",
    technicianId: "",
    requiredSkills: [],
    serviceSuburb: "",
    serviceState: "",
    servicePostcode: "",
    ignoreJobId: "",
    ...initialValues
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [customerQuery, setCustomerQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (!initialValues) return;
    setValues((prev) => ({ ...prev, ...initialValues }));
    setErrors({});
    if (initialValues.ignoreJobId) setAdvancedOpen(true);
  }, [initialValues]);

  const technicianOptions = useMemo(() => {
    const activeFirst = [...technicians].sort((a, b) => Number(Boolean(b.isActive)) - Number(Boolean(a.isActive)));
    return activeFirst;
  }, [technicians]);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, customerQuery]);

  const showPreferredHelper = !values.preferredStart && !values.preferredEnd;
  const preferredStartLocal = useMemo(
    () => (values.preferredStart ? toDateTimeLocal(values.preferredStart) : ""),
    [values.preferredStart]
  );
  const preferredEndLocal = useMemo(
    () => (values.preferredEnd ? toDateTimeLocal(values.preferredEnd) : ""),
    [values.preferredEnd]
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const nextErrors = validate(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        void onSubmit(toPayload(values));
      }}
    >
      {serverError ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{serverError}</div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={customerSearchId} className="text-sm font-medium">
          Find customer
        </label>
        <Input
          id={customerSearchId}
          placeholder="Type to filter the list…"
          disabled={isSubmitting}
          value={customerQuery}
          onChange={(e) => setCustomerQuery(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={customerId} className="text-sm font-medium">
            Customer
          </label>
          <select
            id={customerId}
            value={values.customerId}
            disabled={isSubmitting}
            className={cn(
              "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              errors.customerId && "border-red-500/50"
            )}
            onChange={(e) => setValues((prev) => ({ ...prev, customerId: e.target.value }))}
          >
            <option value="">Select a customer…</option>
            {filteredCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.customerId ? <p className="text-xs text-red-200">{errors.customerId}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor={technicianId} className="text-sm font-medium">
            Preferred technician
          </label>
          <select
            id={technicianId}
            value={values.technicianId}
            disabled={isSubmitting}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(e) => setValues((prev) => ({ ...prev, technicianId: e.target.value }))}
          >
            <option value="">Any qualified technician</option>
            {technicianOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Optional. When set, the assistant prioritizes this person when they are truly available — it will still
            surface stronger matches if they are booked.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="space-y-2">
          <label htmlFor={titleId} className="text-sm font-medium">
            Job title
          </label>
          <Input
            id={titleId}
            value={values.title}
            disabled={isSubmitting}
            placeholder="e.g. Commercial AC service + leak check"
            className={errors.title ? "border-red-500/50" : undefined}
            onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
          />
          {errors.title ? <p className="text-xs text-red-200">{errors.title}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor={durationId} className="text-sm font-medium">
            Duration
          </label>
          <Input
            id={durationId}
            inputMode="numeric"
            value={values.durationMinutes}
            disabled={isSubmitting}
            placeholder="60"
            className={errors.durationMinutes ? "border-red-500/50" : undefined}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                durationMinutes: e.target.value.replace(/[^\d]/g, "")
              }))
            }
          />
          <div className="flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={isSubmitting}
                onClick={() => setValues((prev) => ({ ...prev, durationMinutes: String(m) }))}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                  values.durationMinutes === String(m)
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {m}m
              </button>
            ))}
          </div>
          {errors.durationMinutes ? (
            <p className="text-xs text-red-200">{errors.durationMinutes}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Most field visits land between 60–120 minutes.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-card/80 to-card/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Preferred window</h3>
            <p className="mt-1 text-xs text-muted-foreground">Optional — provide both start and end for tighter guidance.</p>
          </div>
          {showPreferredHelper ? (
            <p className="max-w-[220px] text-xs leading-relaxed text-primary/90">
              No window? The assistant scans a near-future horizon automatically — that is a feature, not a fallback.
            </p>
          ) : null}
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={preferredStartId} className="text-sm font-medium">
              Preferred start
            </label>
            <Input
              id={preferredStartId}
              type="datetime-local"
              value={preferredStartLocal}
              disabled={isSubmitting}
              className={errors.preferredStart ? "border-red-500/50" : undefined}
              onChange={(e) => setValues((prev) => ({ ...prev, preferredStart: e.target.value }))}
            />
            {errors.preferredStart ? (
              <p className="text-xs text-red-200">{errors.preferredStart}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor={preferredEndId} className="text-sm font-medium">
              Preferred end
            </label>
            <Input
              id={preferredEndId}
              type="datetime-local"
              value={preferredEndLocal}
              disabled={isSubmitting}
              className={errors.preferredEnd ? "border-red-500/50" : undefined}
              onChange={(e) => setValues((prev) => ({ ...prev, preferredEnd: e.target.value }))}
            />
            {errors.preferredEnd ? <p className="text-xs text-red-200">{errors.preferredEnd}</p> : null}
          </div>
        </div>
      </div>

      <SchedulingSkillInput
        value={values.requiredSkills}
        disabled={isSubmitting}
        onChange={(next) => setValues((prev) => ({ ...prev, requiredSkills: next }))}
      />

      <div className="rounded-lg border border-border/80 bg-muted/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service area (optional)</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Suburb</label>
            <Input
              value={values.serviceSuburb}
              disabled={isSubmitting}
              placeholder="e.g. Surry Hills"
              onChange={(e) => setValues((prev) => ({ ...prev, serviceSuburb: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">State</label>
            <Input
              value={values.serviceState}
              disabled={isSubmitting}
              placeholder="e.g. NSW"
              onChange={(e) => setValues((prev) => ({ ...prev, serviceState: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Postcode</label>
            <Input
              value={values.servicePostcode}
              disabled={isSubmitting}
              placeholder="e.g. 2010"
              onChange={(e) => setValues((prev) => ({ ...prev, servicePostcode: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-border/80 bg-card/40 px-3 py-2 text-left text-xs font-medium hover:bg-muted/30"
        onClick={() => setAdvancedOpen((o) => !o)}
      >
        <span>Advanced options</span>
        {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {advancedOpen ? (
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/15 p-3">
          <label className="text-sm font-medium">Ignore job when checking conflicts</label>
          <Input
            value={values.ignoreJobId}
            disabled={isSubmitting}
            placeholder="UUID of job being rescheduled"
            className="font-mono text-xs"
            onChange={(e) => setValues((prev) => ({ ...prev, ignoreJobId: e.target.value }))}
          />
          <p className="text-[11px] text-muted-foreground">
            Pass through from job workflows or calendar reschedule — keeps conflict logic accurate while you move
            windows.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end border-t border-border/60 pt-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? "Generating…" : "Suggest schedule"}
        </Button>
      </div>
    </form>
  );
}
