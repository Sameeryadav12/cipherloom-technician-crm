import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ServiceAddon } from "@/types/settings";

type AddonsListProps = {
  addons: ServiceAddon[];
  canMutate: boolean;
  isLoading?: boolean;
  onAdd: () => void;
  onEdit: (addon: ServiceAddon) => void;
  onDelete: (addon: ServiceAddon) => void;
};

function money(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

export function AddonsList({
  addons,
  canMutate,
  isLoading,
  onAdd,
  onEdit,
  onDelete
}: AddonsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        <div className="h-8 animate-pulse rounded bg-muted" />
        <div className="h-8 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (addons.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
        <p>No service add-ons for this rule yet.</p>
        <p className="mt-2 text-xs">
          Add-ons appear as optional invoice lines — ideal for consumables, after-hours surcharges, or equipment fees.
        </p>
        {canMutate ? (
          <Button className="mt-4" variant="outline" onClick={onAdd}>
            Add add-on
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {canMutate ? (
          <Button variant="outline" className="h-8 px-3 text-xs" onClick={onAdd}>
            Add add-on
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/80 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addons.map((addon) => (
              <tr key={addon.id} className="border-t border-border/80 transition-colors hover:bg-muted/20">
                <td className="px-3 py-2.5">
                  <div className="font-medium">{addon.name}</div>
                  {addon.description?.trim() ? (
                    <div className="mt-0.5 max-w-md text-xs leading-relaxed text-muted-foreground">
                      {addon.description}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-base font-semibold tabular-nums text-foreground">{money(addon.price)}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      addon.isActive
                        ? "border-emerald-500/35 bg-emerald-950/25 text-emerald-100"
                        : "border-border/80 bg-muted/40 text-muted-foreground"
                    )}
                  >
                    {addon.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {canMutate ? (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => onEdit(addon)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-xs text-red-300 hover:bg-red-950/20"
                        onClick={() => onDelete(addon)}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
