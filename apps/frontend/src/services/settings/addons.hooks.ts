import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAddonForPricingRule,
  deleteAddon,
  listAddonsForPricingRule,
  updateAddon
} from "./addons.api";
import type { ServiceAddonPayload } from "@/types/settings";
import { pricingRuleKeys } from "./pricing-rules.hooks";

export const addonKeys = {
  all: ["settings", "addons"] as const,
  forRule: (pricingRuleId: string) => ["settings", "addons", "rule", pricingRuleId] as const
};

export function usePricingRuleAddons(pricingRuleId: string, enabled = true) {
  return useQuery({
    queryKey: addonKeys.forRule(pricingRuleId),
    queryFn: () => listAddonsForPricingRule(pricingRuleId),
    select: (response) => response.data.addons,
    enabled: Boolean(pricingRuleId) && enabled
  });
}

export function useCreateAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pricingRuleId, payload }: { pricingRuleId: string; payload: ServiceAddonPayload }) =>
      createAddonForPricingRule(pricingRuleId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: addonKeys.forRule(variables.pricingRuleId) });
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.detail(variables.pricingRuleId) });
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.all });
    }
  });
}

export function useUpdateAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      addonId,
      pricingRuleId,
      payload
    }: {
      addonId: string;
      pricingRuleId: string;
      payload: Partial<ServiceAddonPayload>;
    }) => updateAddon(addonId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: addonKeys.forRule(variables.pricingRuleId) });
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.detail(variables.pricingRuleId) });
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.all });
    }
  });
}

export function useDeleteAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addonId, pricingRuleId }: { addonId: string; pricingRuleId: string }) =>
      deleteAddon(addonId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: addonKeys.forRule(variables.pricingRuleId) });
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.detail(variables.pricingRuleId) });
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.all });
    }
  });
}
