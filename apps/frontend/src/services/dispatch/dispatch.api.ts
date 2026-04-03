import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";
import type { DispatchQueueResponse } from "@/types/dispatch";

export async function getDispatchQueue() {
  return apiClient.get<ApiEnvelope<DispatchQueueResponse>>("/api/dispatch/queue");
}
