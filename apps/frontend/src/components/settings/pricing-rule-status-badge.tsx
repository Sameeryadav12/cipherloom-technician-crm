import { cn } from "@/lib/utils";

type PricingRuleStatusBadgeProps = {
  isDefault: boolean;
  isActive: boolean;
};

export function PricingRuleStatusBadge({ isDefault, isActive }: PricingRuleStatusBadgeProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {isDefault ? (
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
            "border-amber-500/50 bg-amber-950/30 text-amber-200"
          )}
        >
          Default
        </span>
      ) : null}
      <span
        className={cn(
          "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
          isActive
            ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
            : "border-zinc-500/40 bg-zinc-900/40 text-zinc-400"
        )}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
