import type {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType
} from "@prisma/client";

export type NotificationPayload = Record<string, unknown>;

export type CreateNotificationInput = {
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  payload?: NotificationPayload;
  channel?: NotificationChannel;
  status?: NotificationStatus;
};

export type NotifyUserInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  payload?: NotificationPayload;
  channels?: NotificationChannel[];
};

export type NotificationProviderSendInput = {
  to: string;
  subject?: string;
  message: string;
  html?: string;
  meta?: NotificationPayload;
};

export type NotificationProviderResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
};

export type NotificationListFilters = {
  unreadOnly?: boolean;
  type?: NotificationType;
  channel?: NotificationChannel;
  page: number;
  limit: number;
};

export type UserNotification = Notification;
