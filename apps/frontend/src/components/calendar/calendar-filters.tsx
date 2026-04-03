import { useMemo } from "react";
import { Filter, Palmtree, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TechnicianListItem } from "@/types/technicians";

export type CalendarFiltersValue = {
  technicianId: string;
  includeJobs: boolean;
  includeTimeOff: boolean;
};

type CalendarFiltersProps = {
  value: CalendarFiltersValue;
  technicians: TechnicianListItem[];
  isTechnicianUser: boolean;
  onChange: (value: CalendarFiltersValue) => void;
};

function ToggleChip({
  active,
  icon: Icon,
  label,
  onClick,
  disabled
}: {
  active: boolean;
  icon: typeof Wrench;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-primary/45 bg-primary/15 text-primary-foreground shadow-sm"
          : "border-border/80 bg-background/40 text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <Icon className="h-3.5 w-3.5 opacity-90" />
      {label}
    </button>
  );
}

export function CalendarFilters({
  value,
  technicians,
  isTechnicianUser,
  onChange
}: CalendarFiltersProps) {
  const bothOff = useMemo(
    () => !value.includeJobs && !value.includeTimeOff,
    [value.includeJobs, value.includeTimeOff]
  );

  return (
    <div className="rounded-xl border border-border/80 bg-gradient-to-br from-card/90 to-card/40 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        Filters & layers
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {!isTechnicianUser ? (
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <label className="text-xs font-medium text-foreground">Technician lane</label>
            <select
              className={cn(
                "h-10 w-full max-w-md rounded-lg border border-input bg-background/90 px-3 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              value={value.technicianId}
              onChange={(e) => onChange({ ...value, technicianId: e.target.value })}
            >
              <option value="">All technicians — full board</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Narrow to one tech when you are planning their day or validating leave overlap.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Showing your linked technician schedule only.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <ToggleChip
            active={value.includeJobs}
            icon={Wrench}
            label="Jobs"
            onClick={() => onChange({ ...value, includeJobs: !value.includeJobs })}
          />
          <ToggleChip
            active={value.includeTimeOff}
            icon={Palmtree}
            label="Time off"
            onClick={() => onChange({ ...value, includeTimeOff: !value.includeTimeOff })}
          />
        </div>
      </div>
      {bothOff ? (
        <p className="mt-3 rounded-lg border border-amber-500/35 bg-amber-950/20 px-3 py-2 text-xs text-amber-100">
          Enable at least one layer — jobs, time off, or both — so the board can load events.
        </p>
      ) : null}
    </div>
  );
}
