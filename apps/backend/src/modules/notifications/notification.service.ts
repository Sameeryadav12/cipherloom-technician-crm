import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  UserRole,
  type Prisma
} from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { sendEmail } from "./providers/email.provider.js";
import { sendInAppNotification } from "./providers/inapp.provider.js";
import { sendSms } from "./providers/sms.provider.js";
import {
  getDispatchRecipients,
  getUsersByRoles,
  normalizeChannels
} from "./notification.utils.js";
import type {
  CreateNotificationInput,
  NotificationListFilters,
  NotifyUserInput
} from "./notification.types.js";

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      payload: input.payload as Prisma.InputJsonValue | undefined,
      channel: input.channel ?? NotificationChannel.IN_APP,
      status: input.status ?? NotificationStatus.PENDING
    }
  });
}

export async function createInAppNotification(input: CreateNotificationInput) {
  const created = await createNotification({
    ...input,
    channel: NotificationChannel.IN_APP,
    status: NotificationStatus.SENT
  });
  await sendInAppNotification({
    to: input.userId ?? "broadcast",
    message: input.message,
    subject: input.title,
    meta: input.payload
  });
  return created;
}

export async function sendEmailNotification(input: NotifyUserInput & { toEmail: string }) {
  const created = await createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    payload: input.payload,
    channel: NotificationChannel.EMAIL,
    status: NotificationStatus.PENDING
  });
  const result = await sendEmail({
    to: input.toEmail,
    subject: input.title,
    message: input.message,
    meta: input.payload
  });
  return prisma.notification.update({
    where: { id: created.id },
    data: {
      status: result.ok ? NotificationStatus.SENT : NotificationStatus.FAILED
    }
  });
}

export async function sendSmsNotification(input: NotifyUserInput & { toPhone: string }) {
  const created = await createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    payload: input.payload,
    channel: NotificationChannel.SMS,
    status: NotificationStatus.PENDING
  });
  const result = await sendSms({
    to: input.toPhone,
    message: input.message,
    meta: input.payload
  });
  return prisma.notification.update({
    where: { id: created.id },
    data: {
      status: result.ok ? NotificationStatus.SENT : NotificationStatus.FAILED
    }
  });
}

export async function notifyUser(input: NotifyUserInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      notificationPreference: {
        select: {
          inAppEnabled: true,
          emailEnabled: true,
          smsEnabled: true
        }
      }
    }
  });
  if (!user || !user.isActive) return [];

  const channels = normalizeChannels(input.channels);
  const pref = user.notificationPreference;
  const tasks: Array<Promise<unknown>> = [];

  if (channels.includes(NotificationChannel.IN_APP) && (pref?.inAppEnabled ?? true)) {
    tasks.push(
      createInAppNotification({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        payload: input.payload
      })
    );
  }
  if (channels.includes(NotificationChannel.EMAIL) && (pref?.emailEnabled ?? false)) {
    tasks.push(sendEmailNotification({ ...input, toEmail: user.email }));
  }
  // SMS foundation present; no phone on user yet so guarded off unless preference+payload supplies.
  if (channels.includes(NotificationChannel.SMS) && (pref?.smsEnabled ?? false)) {
    const toPhone = typeof input.payload?.["phone"] === "string" ? input.payload["phone"] : "";
    if (toPhone) tasks.push(sendSmsNotification({ ...input, toPhone }));
  }

  return Promise.all(tasks);
}

export async function notifyUsers(inputs: NotifyUserInput[]) {
  return Promise.all(inputs.map((item) => notifyUser(item)));
}

export async function notifyUsersByRole(
  roles: UserRole[],
  base: Omit<NotifyUserInput, "userId">
) {
  const users = await getUsersByRoles(roles);
  return notifyUsers(
    users.map((u) => ({
      userId: u.id,
      ...base
    }))
  );
}

export async function listNotificationsForUser(
  userId: string,
  filters: NotificationListFilters
) {
  const skip = (filters.page - 1) * filters.limit;
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(filters.unreadOnly ? { readAt: null, status: { notIn: [NotificationStatus.DISMISSED] } } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.channel ? { channel: filters.channel } : {})
  };
  const [items, totalItems] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: filters.limit
    }),
    prisma.notification.count({ where })
  ]);
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / filters.limit);
  return {
    items,
    page: filters.page,
    pageSize: filters.limit,
    totalItems,
    totalPages
  };
}

export async function getUnreadCount(userId: string) {
  const unread = await prisma.notification.count({
    where: {
      userId,
      readAt: null,
      status: { notIn: [NotificationStatus.DISMISSED] }
    }
  });
  return { unread };
}

export async function markAsRead(userId: string, notificationId: string) {
  const item = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!item || item.userId !== userId) {
    throw new AppError({ statusCode: 404, message: "Notification not found" });
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date(), status: NotificationStatus.READ }
  });
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date(), status: NotificationStatus.READ }
  });
  return { updated: result.count };
}

export async function dismissNotification(userId: string, notificationId: string) {
  const item = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!item || item.userId !== userId) {
    throw new AppError({ statusCode: 404, message: "Notification not found" });
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { status: NotificationStatus.DISMISSED, readAt: new Date() }
  });
}

export async function notifyDispatchAlert(input: {
  type?: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
}) {
  const recipients = await getDispatchRecipients();
  return notifyUsers(
    recipients.map((recipient) => ({
      userId: recipient.id,
      type: input.type ?? NotificationType.DISPATCH_ALERT,
      title: input.title,
      message: input.message,
      payload: input.payload
    }))
  );
}
