import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";
import type { ServiceAddon, ServiceAddonPayload } from "@/types/settings";

function toAddonListQuery(isActive?: boolean) {
  if (isActive === undefined) return "";
  return `?isActive=${String(isActive)}`;
}

export async function listAddonsForPricingRule(pricingRuleId: string, isActive?: boolean) {
  return apiClient.get<ApiEnvelope<{ addons: ServiceAddon[] }>>(
    `/api/settings/pricing-rules/${pricingRuleId}/addons${toAddonListQuery(isActive)}`
  );
}

export async function createAddonForPricingRule(pricingRuleId: string, payload: ServiceAddonPayload) {
  return apiClient.post<ApiEnvelope<{ addon: ServiceAddon }>>(
    `/api/settings/pricing-rules/${pricingRuleId}/addons`,
    payload
  );
}

export async function updateAddon(addonId: string, payload: Partial<ServiceAddonPayload>) {
  return apiClient.patch<ApiEnvelope<{ addon: ServiceAddon }>>(
    `/api/settings/addons/${addonId}`,
    payload
  );
}

export async function deleteAddon(addonId: string) {
  return apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(
    `/api/settings/addons/${addonId}`
  );
}
