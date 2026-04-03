import type { PaginatedResponse } from "@/types/api";

export type NotificationType =
  | "JOB_ASSIGNED"
  | "JOB_RESCHEDULED"
  | "JOB_CONFLICT"
  | "INVOICE_DUE"
  | "INVOICE_OVERDUE"
  | "TIME_OFF_CONFLICT"
  | "READY_TO_INVOICE"
  | "DISPATCH_ALERT"
  | "SYSTEM";

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ" | "DISMISSED";

export type AppNotification = {
  id: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown> | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationListResponse = PaginatedResponse<AppNotification>;

export type NotificationPreferences = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  typePreferences?: Record<NotificationType, { inApp?: boolean; email?: boolean; sms?: boolean }>;
};
