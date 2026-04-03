import { Info } from "lucide-react";

export function CalendarLegend() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Legend</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/35 bg-blue-950/25 px-2.5 py-1 text-[11px] font-medium text-blue-100/95">
          <span className="h-2 w-2 rounded-sm ring-2 ring-blue-400/50" style={{ background: "rgba(59,130,246,0.45)" }} />
          Jobs
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/35 bg-violet-950/25 px-2.5 py-1 text-[11px] font-medium text-violet-100/95">
          <span className="h-2 w-2 rounded-sm ring-2 ring-violet-400/45" style={{ background: "rgba(168,85,247,0.4)" }} />
          Time off / leave
        </span>
      </div>
      <p className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground sm:max-w-md">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
        Job cards use a strong left accent from technician color when set; otherwise status tint applies. Leave blocks
        stay softer so work stands out on the board.
      </p>
    </div>
  );
}
