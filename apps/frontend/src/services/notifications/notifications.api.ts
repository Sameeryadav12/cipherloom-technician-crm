import { apiClient } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";
import type {
  NotificationChannel,
  NotificationListResponse,
  NotificationType
} from "@/types/notifications";

export type NotificationListParams = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
  channel?: NotificationChannel;
};

function toQuery(params?: NotificationListParams) {
  const query = new URLSearchParams();
  if (!params) return "";
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.unreadOnly) query.set("unreadOnly", "true");
  if (params.type) query.set("type", params.type);
  if (params.channel) query.set("channel", params.channel);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function listNotifications(params?: NotificationListParams) {
  return apiClient.get<ApiEnvelope<NotificationListResponse>>(`/api/notifications${toQuery(params)}`);
}

export async function getUnreadNotificationCount() {
  return apiClient.get<ApiEnvelope<{ unread: number }>>("/api/notifications/unread-count");
}

export async function markNotificationRead(id: string) {
  return apiClient.patch<ApiEnvelope<{ notification: unknown }>>(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  return apiClient.patch<ApiEnvelope<{ updated: number }>>("/api/notifications/read-all");
}

export async function dismissNotification(id: string) {
  return apiClient.patch<ApiEnvelope<{ notification: unknown }>>(`/api/notifications/${id}/dismiss`);
}

export async function sendTestNotification(payload: {
  title: string;
  message: string;
  type?: NotificationType;
  channels?: NotificationChannel[];
  payload?: Record<string, unknown>;
}) {
  return apiClient.post<ApiEnvelope<{ queued: boolean }>>("/api/notifications/test", payload);
}
