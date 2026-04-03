import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope, Customer, PaginatedResponse } from "@/types/api";

export type CustomersListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

function toQueryString(params?: CustomersListParams) {
  const query = new URLSearchParams();
  if (!params) return "";
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function listCustomers(params?: CustomersListParams) {
  return apiClient.get<ApiEnvelope<PaginatedResponse<Customer>>>(
    `/api/customers${toQueryString(params)}`
  );
}

export async function getCustomerById(id: string) {
  return apiClient.get<ApiEnvelope<{ customer: Customer }>>(`/api/customers/${id}`);
}

export type CustomerPayload = {
  name: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
  notes?: string;
};

export async function createCustomer(payload: CustomerPayload) {
  return apiClient.post<ApiEnvelope<{ customer: Customer }>>("/api/customers", payload);
}

export async function updateCustomer(id: string, payload: Partial<CustomerPayload>) {
  return apiClient.patch<ApiEnvelope<{ customer: Customer }>>(`/api/customers/${id}`, payload);
}

export async function deleteCustomer(id: string) {
  return apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(`/api/customers/${id}`);
}

