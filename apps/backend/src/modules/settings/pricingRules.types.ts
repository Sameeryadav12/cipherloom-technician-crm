import type { PricingRule } from "@prisma/client";

export type PricingRulePublic = PricingRule & {
  _count?: {
    serviceAddons: number;
  };
};

