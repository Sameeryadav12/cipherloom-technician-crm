import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
  type CustomerPayload,
  type CustomersListParams
} from "./customers.api";

export const customerKeys = {
  all: ["customers"] as const,
  list: (params?: CustomersListParams) => ["customers", "list", params ?? {}] as const,
  detail: (id: string) => ["customers", "detail", id] as const
};

type ListQueryOptions = { enabled?: boolean };

export function useCustomersList(params?: CustomersListParams, options?: ListQueryOptions) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomers(params),
    select: (response) => response.data,
    enabled: options?.enabled ?? true
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomerById(id),
    select: (response) => response.data.customer,
    enabled: Boolean(id)
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerPayload) => createCustomer(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
    }
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CustomerPayload> }) =>
      updateCustomer(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
    }
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      void queryClient.removeQueries({ queryKey: customerKeys.detail(id) });
    }
  });
}

