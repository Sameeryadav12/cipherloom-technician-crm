import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteInvoice,
  generateInvoiceFromJob,
  getInvoiceById,
  listInvoices,
  updateInvoice,
  type InvoicesListParams
} from "./invoices.api";
import type { UpdateInvoicePayload } from "@/types/invoices";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (params?: InvoicesListParams) => ["invoices", "list", params ?? {}] as const,
  detail: (id: string) => ["invoices", "detail", id] as const
};

type ListQueryOptions = { enabled?: boolean };

export function useInvoicesList(params?: InvoicesListParams, options?: ListQueryOptions) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => listInvoices(params),
    select: (response) => response.data,
    enabled: options?.enabled ?? true
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceById(id),
    select: (response) => response.data.invoice,
    enabled: Boolean(id)
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInvoicePayload }) =>
      updateInvoice(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.removeQueries({ queryKey: invoiceKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useGenerateInvoiceFromJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => generateInvoiceFromJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

