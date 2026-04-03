import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PricingRuleStatusBadge } from "./pricing-rule-status-badge";
import type { PricingRuleListItem } from "@/types/settings";

type PricingRulesTableProps = {
  items: PricingRuleListItem[];
  selectedId: string | null;
  canMutate: boolean;
  onSelectManage: (rule: PricingRuleListItem) => void;
  onEdit: (rule: PricingRuleListItem) => void;
  onDelete: (rule: PricingRuleListItem) => void;
  onSetDefault: (rule: PricingRuleListItem) => void;
};

function money(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

export function PricingRulesTable({
  items,
  selectedId,
  canMutate,
  onSelectManage,
  onEdit,
  onDelete,
  onSetDefault
}: PricingRulesTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Base fee</th>
            <th className="px-4 py-3">Block</th>
            <th className="px-4 py-3">Rate</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Add-ons</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((rule) => {
            const isSelected = selectedId === rule.id;
            return (
              <tr
                key={rule.id}
                className={cn(
                  "border-t border-border/80 transition-colors hover:bg-muted/25",
                  isSelected && "bg-primary/5",
                  rule.isDefault && "bg-amber-950/10"
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {rule.name}
                    {rule.isDefault ? (
                      <span className="rounded-full border border-amber-500/35 bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                        Default
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{money(rule.baseCalloutFee)}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{rule.blockMinutes} min</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{money(rule.blockRate)}</td>
                <td className="px-4 py-3">
                  <PricingRuleStatusBadge isDefault={rule.isDefault} isActive={rule.isActive} />
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {rule._count?.serviceAddons ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button
                      variant={isSelected ? "default" : "ghost"}
                      className={cn(
                        "h-8 px-2 text-xs",
                        isSelected && "bg-primary/90 hover:brightness-110"
                      )}
                      onClick={() => onSelectManage(rule)}
                    >
                      {isSelected ? "Selected" : "Manage"}
                    </Button>
                    {canMutate ? (
                      <>
                        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => onEdit(rule)}>
                          Edit
                        </Button>
                        {!rule.isDefault ? (
                          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => onSetDefault(rule)}>
                            Set default
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs text-red-300 hover:bg-red-950/20"
                          onClick={() => onDelete(rule)}
                        >
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
