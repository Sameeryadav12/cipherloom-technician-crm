import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope, PaginatedResponse } from "@/types/api";
import type { PricingRule, PricingRulePayload, PricingRulesListParams } from "@/types/settings";

function toListQuery(params?: PricingRulesListParams) {
  const query = new URLSearchParams();
  if (!params) return "";
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  if (params.isDefault !== undefined) query.set("isDefault", String(params.isDefault));
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function listPricingRules(params?: PricingRulesListParams) {
  return apiClient.get<ApiEnvelope<PaginatedResponse<PricingRule>>>(
    `/api/settings/pricing-rules${toListQuery(params)}`
  );
}

export async function getPricingRuleById(id: string) {
  return apiClient.get<ApiEnvelope<{ pricingRule: PricingRule }>>(
    `/api/settings/pricing-rules/${id}`
  );
}

export async function createPricingRule(payload: PricingRulePayload) {
  return apiClient.post<ApiEnvelope<{ pricingRule: PricingRule }>>(
    "/api/settings/pricing-rules",
    payload
  );
}

export async function updatePricingRule(id: string, payload: Partial<PricingRulePayload>) {
  return apiClient.patch<ApiEnvelope<{ pricingRule: PricingRule }>>(
    `/api/settings/pricing-rules/${id}`,
    payload
  );
}

export async function deletePricingRule(id: string) {
  return apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(
    `/api/settings/pricing-rules/${id}`
  );
}
