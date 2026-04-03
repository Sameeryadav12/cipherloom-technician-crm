import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/format-datetime";
import { TechnicianColorSwatch } from "./technician-color-swatch";
import { TechnicianRowActions } from "./technician-row-actions";
import { TechnicianSkillsList } from "./technician-skills-list";
import { TechnicianStatusBadge } from "./technician-status-badge";
import type { TechnicianListItem } from "@/types/technicians";

export type TechnicianRowOps = {
  jobsToday: number;
  onLeaveNow: boolean;
};

type TechnicianTableProps = {
  items: TechnicianListItem[];
  opsByTechnicianId?: Map<string, TechnicianRowOps>;
  onEdit: (technician: TechnicianListItem) => void;
  onDelete: (technician: TechnicianListItem) => void;
};

export function TechnicianTable({ items, opsByTechnicianId, onEdit, onDelete }: TechnicianTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/30 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
          <tr>
            <th className="px-4 py-3">Technician</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Skills</th>
            <th className="px-4 py-3">Today</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Portal</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((technician) => {
            const ops = opsByTechnicianId?.get(technician.id);
            const jobsToday = ops?.jobsToday ?? 0;
            const onLeave = ops?.onLeaveNow ?? false;

            return (
              <tr
                key={technician.id}
                className={cn(
                  "border-t border-border/60 transition-colors",
                  "hover:bg-primary/[0.06]"
                )}
              >
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <TechnicianColorSwatch color={technician.color} />
                    <Link
                      to={`/technicians/${technician.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {technician.name}
                    </Link>
                  </div>
                  {onLeave ? (
                    <span className="mt-1 inline-flex rounded-full border border-violet-500/35 bg-violet-950/25 px-2 py-0.5 text-[11px] text-violet-200">
                      On leave now
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">
                  <div className="text-xs">{technician.email ?? "—"}</div>
                  <div className="mt-0.5 text-xs">{technician.phone ?? "—"}</div>
                </td>
                <td className="max-w-[220px] px-4 py-3 align-top">
                  <TechnicianSkillsList skills={technician.skills ?? []} />
                </td>
                <td className="px-4 py-3 align-top">
                  {jobsToday > 0 ? (
                    <span className="inline-flex rounded-full border border-emerald-500/35 bg-emerald-950/20 px-2 py-0.5 text-xs font-medium text-emerald-200">
                      {jobsToday} scheduled
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <TechnicianStatusBadge isActive={technician.isActive} />
                </td>
                <td className="max-w-[180px] px-4 py-3 align-top text-xs text-muted-foreground">
                  {technician.linkedUser ? (
                    <span className="line-clamp-2" title={technician.linkedUser.email}>
                      {technician.linkedUser.email}
                      <span className="ml-1 rounded border border-border/60 px-1 text-[10px] uppercase tracking-wide">
                        {technician.linkedUser.role}
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">
                  {formatShortDate(technician.createdAt)}
                </td>
                <td className="px-4 py-3 align-top">
                  <TechnicianRowActions technician={technician} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
