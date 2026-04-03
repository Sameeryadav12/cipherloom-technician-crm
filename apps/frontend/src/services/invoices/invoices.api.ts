import { apiClient } from "@/lib/api-client";
import type {
  ApiEnvelope,
  Invoice,
  InvoiceStatus,
  PaginatedResponse
} from "@/types/api";
import type {
  InvoiceDetail,
  InvoiceListItem,
  UpdateInvoicePayload
} from "@/types/invoices";

export type InvoicesListParams = {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customerId?: string;
  issuedAtFrom?: string;
  issuedAtTo?: string;
};

function toQueryString(params?: InvoicesListParams) {
  const query = new URLSearchParams();
  if (!params) return "";
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.customerId) query.set("customerId", params.customerId);
  if (params.issuedAtFrom) query.set("issuedAtFrom", params.issuedAtFrom);
  if (params.issuedAtTo) query.set("issuedAtTo", params.issuedAtTo);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function listInvoices(params?: InvoicesListParams) {
  return apiClient.get<ApiEnvelope<PaginatedResponse<InvoiceListItem>>>(
    `/api/invoices${toQueryString(params)}`
  );
}

export async function getInvoiceById(id: string) {
  return apiClient.get<ApiEnvelope<{ invoice: InvoiceDetail }>>(`/api/invoices/${id}`);
}

export async function updateInvoice(id: string, payload: UpdateInvoicePayload) {
  return apiClient.patch<ApiEnvelope<{ invoice: Invoice }>>(`/api/invoices/${id}`, payload);
}

export async function deleteInvoice(id: string) {
  return apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(`/api/invoices/${id}`);
}

export async function generateInvoiceFromJob(jobId: string) {
  return apiClient.post<ApiEnvelope<{ invoice: Invoice }>>(`/api/jobs/${jobId}/generate-invoice`, {});
}

