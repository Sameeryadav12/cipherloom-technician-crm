import { cn } from "@/lib/utils";

type TechnicianStatusBadgeProps = {
  isActive: boolean;
};

export function TechnicianStatusBadge({ isActive }: TechnicianStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        isActive
          ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
          : "border-zinc-500/40 bg-zinc-900/40 text-zinc-300"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

