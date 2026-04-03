import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PricingRuleStatusBadge } from "./pricing-rule-status-badge";
import type { PricingRule } from "@/types/settings";

type PricingRuleDetailCardProps = {
  rule: PricingRule;
};

function money(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

export function PricingRuleDetailCard({ rule }: PricingRuleDetailCardProps) {
  const base = Number(rule.baseCalloutFee);
  const blockM = Number(rule.blockMinutes);
  const rate = Number(rule.blockRate);
  const exampleMinutes = 60;
  const blocks = Math.ceil(exampleMinutes / (blockM > 0 ? blockM : 1));
  const labor = blocks * rate;
  const exampleTotal = (Number.isFinite(base) ? base : 0) + (Number.isFinite(labor) ? labor : 0);

  return (
    <Card className="border-border/80 bg-gradient-to-br from-card via-card to-muted/10">
      <CardTitle className="flex flex-wrap items-center gap-2">
        {rule.name}
        <PricingRuleStatusBadge isDefault={rule.isDefault} isActive={rule.isActive} />
      </CardTitle>
      {rule.description?.trim() ? (
        <CardDescription className="mt-2 leading-relaxed">{rule.description}</CardDescription>
      ) : (
        <CardDescription className="mt-2">
          This rule controls how call-out fees and labor blocks roll into quotes and invoices for jobs that reference it.
        </CardDescription>
      )}
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Base callout</dt>
          <dd className="font-semibold">{money(rule.baseCalloutFee)}</dd>
          <dd className="mt-1 text-[11px] text-muted-foreground">Charged once per visit before time blocks.</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Labor blocks</dt>
          <dd className="font-semibold">
            {rule.blockMinutes} min @ {money(rule.blockRate)}
          </dd>
          <dd className="mt-1 text-[11px] text-muted-foreground">Time rounds up in block increments for billing.</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Add-ons</dt>
          <dd className="font-semibold">{rule._count?.serviceAddons ?? rule.serviceAddons?.length ?? 0}</dd>
          <dd className="mt-1 text-[11px] text-muted-foreground">Optional line items stacked on top of labor.</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">Example (labor only)</p>
        <p className="mt-2 text-muted-foreground">
          A <span className="font-medium text-foreground">{exampleMinutes}-minute</span> visit ≈{" "}
          <span className="font-medium text-foreground">{blocks}</span> block{blocks === 1 ? "" : "s"} of {blockM}{" "}
          minutes: {money(base)} base + {money(labor)} labor →{" "}
          <span className="font-semibold text-foreground">{money(exampleTotal)}</span> subtotal before add-ons and tax.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Future jobs pick up new numbers automatically; existing invoices are not rewritten when you edit a rule.
        </p>
      </div>
    </Card>
  );
}
