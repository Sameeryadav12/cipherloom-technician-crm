import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CustomerListItem } from "@/types/customers";
import type { CustomerFormValues } from "@/types/customers";

type CustomerFormProps = {
  initialValues: CustomerFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  /** Used for lightweight duplicate hints (email / phone) while creating or editing. */
  peerCustomers?: CustomerListItem[];
  excludeCustomerId?: string;
  onSubmit: (values: CustomerFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

type FieldErrors = Partial<Record<keyof CustomerFormValues, string>>;

function toTrimmedPayload(values: CustomerFormValues): CustomerFormValues {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    addressLine1: values.addressLine1.trim(),
    addressLine2: values.addressLine2.trim(),
    suburb: values.suburb.trim(),
    state: values.state.trim(),
    postcode: values.postcode.trim(),
    country: values.country.trim(),
    notes: values.notes.trim()
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function CustomerForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  serverError,
  peerCustomers = [],
  excludeCustomerId,
  onSubmit,
  onCancel
}: CustomerFormProps) {
  const [values, setValues] = useState<CustomerFormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setSubmitted(false);
  }, [initialValues]);

  const duplicateHint = useMemo(() => {
    const email = values.email.trim().toLowerCase();
    const phone = normalizePhone(values.phone);
    if (email.length < 5 && phone.length < 8) return null;
    for (const c of peerCustomers) {
      if (c.id === excludeCustomerId) continue;
      const em = (c.email ?? "").trim().toLowerCase();
      const ph = normalizePhone(c.phone ?? "");
      if (email && em && email === em) {
        return `Possible duplicate: ${c.name} shares this email.`;
      }
      if (phone.length >= 8 && ph.length >= 8 && phone === ph) {
        return `Possible duplicate: ${c.name} shares this phone number.`;
      }
    }
    return null;
  }, [excludeCustomerId, peerCustomers, values.email, values.phone]);

  const errors = useMemo<FieldErrors>(() => {
    const next: FieldErrors = {};
    if (values.name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    if (values.email.trim() && !isValidEmail(values.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    return next;
  }, [values.email, values.name]);

  const setField = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    await onSubmit(toTrimmedPayload(values));
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {duplicateHint ? (
        <p
          className={cn(
            "rounded-lg border border-amber-500/35 bg-amber-950/20 px-3 py-2 text-xs",
            "text-amber-100"
          )}
        >
          {duplicateHint}
        </p>
      ) : null}

      <FormSection title="Basics" description="How this account appears on jobs and invoices.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={values.name} onChange={(e) => setField("name", e.target.value)} />
            {submitted && errors.name ? <p className="text-xs text-red-400">{errors.name}</p> : null}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Contact"
        description="Used for reminders, billing notices, and day-of coordination."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            {submitted && errors.email ? <p className="text-xs text-red-400">{errors.email}</p> : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Phone</label>
            <Input
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Service address"
        description="Helps technicians route visits and validate coverage."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Address line 1</label>
            <Input value={values.addressLine1} onChange={(e) => setField("addressLine1", e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Address line 2</label>
            <Input value={values.addressLine2} onChange={(e) => setField("addressLine2", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Suburb</label>
            <Input value={values.suburb} onChange={(e) => setField("suburb", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">State</label>
            <Input value={values.state} onChange={(e) => setField("state", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Postcode</label>
            <Input value={values.postcode} onChange={(e) => setField("postcode", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Country</label>
            <Input value={values.country} onChange={(e) => setField("country", e.target.value)} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Notes" description="Internal context — access, billing quirks, gate codes.">
        <div className="space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={values.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </div>
      </FormSection>

      {serverError ? (
        <p className="rounded-md border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-300">
          {serverError}
        </p>
      ) : null}

      <div className="sticky bottom-0 z-[1] flex justify-end gap-2 border-t border-border/80 bg-card/90 py-4 backdrop-blur-md">
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

