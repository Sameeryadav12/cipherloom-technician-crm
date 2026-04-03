import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope, LoginApiResponse } from "@/types/api";
import type { LoginRequest } from "@/types/auth";

export async function loginApi(payload: LoginRequest) {
  return apiClient.post<ApiEnvelope<LoginApiResponse> | LoginApiResponse>(
    "/api/auth/login",
    payload,
    { skipAuth: true }
  );
}

export async function refreshApi(refreshToken: string) {
  return apiClient.post<ApiEnvelope<LoginApiResponse> | LoginApiResponse>(
    "/api/auth/refresh",
    { refreshToken },
    { skipAuth: true }
  );
}

