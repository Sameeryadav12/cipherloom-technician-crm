import type { PaginatedResponse } from "@/types/api";

export type ServiceAddon = {
  id: string;
  pricingRuleId: string;
  name: string;
  description: string | null;
  price: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PricingRule = {
  id: string;
  name: string;
  description: string | null;
  baseCalloutFee: string;
  blockMinutes: number;
  blockRate: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    serviceAddons: number;
  };
  serviceAddons?: ServiceAddon[];
};

export type PricingRuleListItem = PricingRule;

export type PricingRuleFormValues = {
  name: string;
  description: string;
  baseCalloutFee: string;
  blockMinutes: string;
  blockRate: string;
  isDefault: boolean;
  isActive: boolean;
};

export type PricingRulePayload = {
  name: string;
  description?: string;
  baseCalloutFee: number;
  blockMinutes: number;
  blockRate: number;
  isDefault?: boolean;
  isActive?: boolean;
};

export type PricingRulesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isDefault?: boolean;
};

export type PricingRulesListResponse = PaginatedResponse<PricingRuleListItem>;

export type ServiceAddonFormValues = {
  name: string;
  description: string;
  price: string;
  isActive: boolean;
};

export type ServiceAddonPayload = {
  name: string;
  description?: string;
  price: number;
  isActive?: boolean;
};
