import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope, PaginatedResponse, Technician } from "@/types/api";
import type { TechnicianDetail, TechnicianListItem, TechnicianPayload } from "@/types/technicians";

export type TechniciansListParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};

function toQueryString(params?: TechniciansListParams) {
  const query = new URLSearchParams();
  if (!params) return "";
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function listTechnicians(params?: TechniciansListParams) {
  return apiClient.get<ApiEnvelope<PaginatedResponse<TechnicianListItem>>>(
    `/api/technicians${toQueryString(params)}`
  );
}

export async function getTechnicianById(id: string) {
  return apiClient.get<ApiEnvelope<{ technician: TechnicianDetail }>>(`/api/technicians/${id}`);
}

export async function createTechnician(payload: TechnicianPayload) {
  return apiClient.post<ApiEnvelope<{ technician: Technician }>>("/api/technicians", payload);
}

export async function updateTechnician(
  id: string,
  payload: Partial<TechnicianPayload>
) {
  return apiClient.patch<ApiEnvelope<{ technician: Technician }>>(
    `/api/technicians/${id}`,
    payload
  );
}

export async function deleteTechnician(id: string) {
  return apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(`/api/technicians/${id}`);
}

