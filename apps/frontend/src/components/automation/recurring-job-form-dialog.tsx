import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CustomerListItem } from "@/types/customers";
import type { TechnicianListItem } from "@/types/technicians";
import type { RecurrencePattern, RecurringJobTemplate } from "@/types/automation";

type RecurringJobFormDialogProps = {
  open: boolean;
  editing?: RecurringJobTemplate | null;
  customers: CustomerListItem[];
  technicians: TechnicianListItem[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    customerId: string;
    title: string;
    description?: string;
    technicianId?: string;
    durationMinutes: number;
    recurrencePattern: RecurrencePattern;
    startDate: string;
    endDate?: string;
    isActive: boolean;
  }) => void;
};

export function RecurringJobFormDialog({
  open,
  editing,
  customers,
  technicians,
  isSubmitting,
  onClose,
  onSubmit
}: RecurringJobFormDialogProps) {
  const [form, setForm] = useState({
    customerId: "",
    title: "",
    description: "",
    technicianId: "",
    durationMinutes: "60",
    recurrencePattern: "WEEKLY" as RecurrencePattern,
    startDate: "",
    endDate: "",
    isActive: true
  });

  useEffect(() => {
    if (!open) return;
    if (!editing) {
      setForm((prev) => ({ ...prev, customerId: "", title: "", description: "", technicianId: "", durationMinutes: "60", recurrencePattern: "WEEKLY", startDate: "", endDate: "", isActive: true }));
      return;
    }
    setForm({
      customerId: editing.customerId,
      title: editing.title,
      description: editing.description ?? "",
      technicianId: editing.technicianId ?? "",
      durationMinutes: String(editing.durationMinutes),
      recurrencePattern: editing.recurrencePattern,
      startDate: editing.startDate.slice(0, 10),
      endDate: editing.endDate ? editing.endDate.slice(0, 10) : "",
      isActive: editing.isActive
    });
  }, [editing, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-xl">
        <h3 className="text-base font-semibold">{editing ? "Edit recurring template" : "Create recurring template"}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}>
            <option value="">Customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.technicianId} onChange={(e) => setForm((f) => ({ ...f, technicianId: e.target.value }))}>
            <option value="">Any technician</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input placeholder="Duration minutes" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value.replace(/[^\d]/g, "") }))} />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.recurrencePattern} onChange={(e) => setForm((f) => ({ ...f, recurrencePattern: e.target.value as RecurrencePattern }))}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Active
          </label>
          <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          <div className="md:col-span-2">
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            onClick={() =>
              onSubmit({
                customerId: form.customerId,
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                technicianId: form.technicianId || undefined,
                durationMinutes: Number(form.durationMinutes || "60"),
                recurrencePattern: form.recurrencePattern,
                startDate: new Date(form.startDate).toISOString(),
                endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
                isActive: form.isActive
              })
            }
            disabled={isSubmitting || !form.customerId || !form.title.trim() || !form.startDate}
          >
            {isSubmitting ? "Saving..." : editing ? "Save changes" : "Create template"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
