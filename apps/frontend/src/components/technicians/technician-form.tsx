import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SchedulingSkillInput } from "@/components/scheduling/scheduling-skill-input";
import type { TechnicianFormValues } from "@/types/technicians";

type TechnicianFormProps = {
  initialValues: TechnicianFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  linkedUserSummary?: string | null;
  onSubmit: (values: TechnicianFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

type FieldErrors = Partial<Record<keyof TechnicianFormValues, string>>;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function TechnicianForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  serverError,
  linkedUserSummary,
  onSubmit,
  onCancel
}: TechnicianFormProps) {
  const [values, setValues] = useState<TechnicianFormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setSubmitted(false);
  }, [initialValues]);

  const errors = useMemo<FieldErrors>(() => {
    const next: FieldErrors = {};
    if (values.name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (values.email.trim() && !isValidEmail(values.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (values.color.trim() && !isHexColor(values.color.trim())) {
      next.color = "Color must be in #RRGGBB format.";
    }
    return next;
  }, [values]);

  const setField = <K extends keyof TechnicianFormValues>(key: K, value: TechnicianFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    await onSubmit({
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      skills: values.skills,
      color: values.color.trim(),
      linkedUserId: values.linkedUserId.trim()
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
        <h3 className="text-sm font-semibold">Identity</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Field profile shown on the schedule board and job assignments.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={values.name} onChange={(e) => setField("name", e.target.value)} />
            {submitted && errors.name ? <p className="text-xs text-red-400">{errors.name}</p> : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input value={values.email} onChange={(e) => setField("email", e.target.value)} />
            {submitted && errors.email ? <p className="text-xs text-red-400">{errors.email}</p> : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Phone</label>
            <Input value={values.phone} onChange={(e) => setField("phone", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
        <SchedulingSkillInput
          label="Skills"
          value={values.skills}
          placeholder="e.g. HVAC, networking, ladder certified"
          disabled={isSubmitting}
          onChange={(next) => setField("skills", next)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter or comma to add. Skills power scheduling matches and dispatch filters.
        </p>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
        <h3 className="text-sm font-semibold">Calendar & status</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Color (#RRGGBB)</label>
            <Input value={values.color} onChange={(e) => setField("color", e.target.value)} placeholder="#3b82f6" />
            {submitted && errors.color ? <p className="text-xs text-red-400">{errors.color}</p> : null}
          </div>
          <label className="flex items-center gap-2 self-end text-sm pb-2">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
            />
            Active technician
          </label>
        </div>
      </div>

      <details className="rounded-lg border border-border/60 bg-muted/10 p-4">
        <summary className="cursor-pointer text-sm font-semibold">Portal account link (optional)</summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Link this profile to a staff login with the Technician role so they can use the field portal.
          Paste the user ID from your identity provider or database — a searchable directory is planned.
        </p>
        {linkedUserSummary ? (
          <p className="mt-2 text-xs text-sky-200/90">Currently linked: {linkedUserSummary}</p>
        ) : null}
        <div className="mt-3 space-y-1">
          <label className="text-sm font-medium">Linked user ID</label>
          <Input
            value={values.linkedUserId}
            onChange={(e) => setField("linkedUserId", e.target.value)}
            placeholder="Leave blank if no portal login"
            className="font-mono text-xs"
          />
        </div>
      </details>

      {serverError ? (
        <p className="rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-300">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} type="button">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
