import { Prisma } from "@prisma/client";
import type { PricingRule, ServiceAddon } from "@prisma/client";

type DecimalLike = Prisma.Decimal | string | number;

function d(value: DecimalLike): Prisma.Decimal {
  return new Prisma.Decimal(value.toString());
}

/**
 * Computes invoice line amounts from a pricing rule, optional job duration, and optional add-ons.
 * All money uses Prisma.Decimal (no floating-point arithmetic).
 */
export function calculateInvoiceAmounts(input: {
  rule: Pick<PricingRule, "baseCalloutFee" | "blockMinutes" | "blockRate">;
  jobScheduledStart: Date | null;
  jobScheduledEnd: Date | null;
  addons: Pick<ServiceAddon, "price">[];
  taxRatePercent: number;
  discount: Prisma.Decimal;
}): {
  subtotal: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
} {
  const base = d(input.rule.baseCalloutFee);
  let subtotal = base;

  const start = input.jobScheduledStart;
  const end = input.jobScheduledEnd;
  const blockMinutes = input.rule.blockMinutes;

  if (start && end && end > start && blockMinutes > 0) {
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.max(0, Math.ceil(durationMs / 60_000));
    const blocks = Math.ceil(durationMinutes / blockMinutes);
    const blockCharge = d(input.rule.blockRate).mul(blocks);
    subtotal = subtotal.add(blockCharge);
  }

  for (const addon of input.addons) {
    subtotal = subtotal.add(d(addon.price));
  }

  subtotal = subtotal.toDecimalPlaces(2);

  const rate = input.taxRatePercent;
  const tax =
    rate > 0
      ? subtotal.mul(d(rate)).div(100).toDecimalPlaces(2)
      : d(0);

  const discount = d(input.discount).toDecimalPlaces(2);
  let total = subtotal.add(tax).sub(discount);
  if (total.lessThan(0)) {
    total = d(0);
  } else {
    total = total.toDecimalPlaces(2);
  }

  return { subtotal, tax, total };
}
