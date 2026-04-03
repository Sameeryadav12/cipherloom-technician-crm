import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPricingRule,
  deletePricingRule,
  getPricingRuleById,
  listPricingRules,
  updatePricingRule
} from "./pricing-rules.api";
import type { PricingRulePayload, PricingRulesListParams } from "@/types/settings";

export const pricingRuleKeys = {
  all: ["settings", "pricing-rules"] as const,
  list: (params?: PricingRulesListParams) => ["settings", "pricing-rules", "list", params ?? {}] as const,
  detail: (id: string) => ["settings", "pricing-rules", "detail", id] as const
};

export function usePricingRulesList(params?: PricingRulesListParams) {
  return useQuery({
    queryKey: pricingRuleKeys.list(params),
    queryFn: () => listPricingRules(params),
    select: (response) => response.data
  });
}

export function usePricingRule(id: string, enabled = true) {
  return useQuery({
    queryKey: pricingRuleKeys.detail(id),
    queryFn: () => getPricingRuleById(id),
    select: (response) => response.data.pricingRule,
    enabled: Boolean(id) && enabled
  });
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PricingRulePayload) => createPricingRule(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.all });
    }
  });
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PricingRulePayload> }) =>
      updatePricingRule(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.all });
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.detail(variables.id) });
    }
  });
}

export function useDeletePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePricingRule(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: pricingRuleKeys.all });
      void queryClient.removeQueries({ queryKey: pricingRuleKeys.detail(id) });
    }
  });
}
