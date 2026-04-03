import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/api";
import type { Customer } from "@/types/api";
import type { TechnicianListItem } from "@/types/technicians";

export type JobQuickPreset =
  | "all"
  | "today"
  | "unassigned"
  | "needs_scheduling"
  | "invoice_ready"
  | "cancelled";

export type JobFiltersValue = {
  status: JobStatus | "";
  customerId: string;
  technicianId: string;
  scheduledStartFrom: string;
  scheduledStartTo: string;
};

type JobFiltersProps = {
  value: JobFiltersValue;
  customers: Customer[];
  technicians: TechnicianListItem[];
  quickPreset: JobQuickPreset;
  onQuickPreset: (preset: JobQuickPreset) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (value: JobFiltersValue) => void;
  onReset: () => void;
};

const statusOptions: Array<JobStatus> = [
  "NEW",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICED",
  "CANCELLED"
];

const presetConfig: Array<{ id: JobQuickPreset; label: string }> = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "unassigned", label: "Unassigned" },
  { id: "needs_scheduling", label: "Needs scheduling" },
  { id: "invoice_ready", label: "Invoice ready" },
  { id: "cancelled", label: "Cancelled" }
];

const selectClass =
  "h-10 w-full rounded-lg border border-border/90 bg-background/70 px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

export function JobFilters({
  value,
  customers,
  technicians,
  quickPreset,
  onQuickPreset,
  search,
  onSearchChange,
  onChange,
  onReset
}: JobFiltersProps) {
  const hasDetailFilters = Boolean(
    value.status || value.customerId || value.technicianId || value.scheduledStartFrom || value.scheduledStartTo
  );

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card/50 p-4 shadow-surface">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 hidden items-center gap-1 text-xs font-medium text-muted-foreground sm:inline-flex">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Quick views
          </span>
          {presetConfig.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onQuickPreset(p.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                quickPreset === p.id
                  ? "border-primary/50 bg-primary/20 text-primary"
                  : "border-border/80 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search titles on this page…"
            className="h-10 border-border/90 bg-background/70 pl-9"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[11px] font-medium text-muted-foreground">Status</label>
          <select
            className={selectClass}
            value={value.status}
            onChange={(event) => onChange({ ...value, status: event.target.value as JobStatus | "" })}
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[11px] font-medium text-muted-foreground">Customer</label>
          <select
            className={selectClass}
            value={value.customerId}
            onChange={(event) => onChange({ ...value, customerId: event.target.value })}
          >
            <option value="">All customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[11px] font-medium text-muted-foreground">Technician</label>
          <select
            className={selectClass}
            value={value.technicianId}
            onChange={(event) => onChange({ ...value, technicianId: event.target.value })}
          >
            <option value="">All technicians</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Scheduled from</label>
          <Input
            type="date"
            className="h-10 border-border/90 bg-background/70"
            value={value.scheduledStartFrom}
            onChange={(event) => onChange({ ...value, scheduledStartFrom: event.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">Scheduled to</label>
          <Input
            type="date"
            className="h-10 border-border/90 bg-background/70"
            value={value.scheduledStartTo}
            onChange={(event) => onChange({ ...value, scheduledStartTo: event.target.value })}
          />
        </div>

        <div className="flex gap-2 lg:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 border-border/90"
            onClick={onReset}
            disabled={!hasDetailFilters && !search}
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
