import { UserRole } from "@prisma/client";
import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { created, ok, paginated } from "../../utils/api-response.js";
import type {
  ListNotificationsQuery,
  NotificationTestBody
} from "./notification.schemas.js";
import * as notificationService from "./notification.service.js";

function requireAuthUser(req: Request) {
  if (!req.user) throw new AppError({ statusCode: 401, message: "Unauthorized" });
  return req.user;
}

export async function listNotifications(req: Request, res: Response) {
  const user = requireAuthUser(req);
  const query = req.query as unknown as ListNotificationsQuery;
  const data = await notificationService.listNotificationsForUser(user.id, query);
  return paginated(res, data);
}

export async function getUnreadCount(req: Request, res: Response) {
  const user = requireAuthUser(req);
  const data = await notificationService.getUnreadCount(user.id);
  return ok(res, data);
}

export async function markNotificationRead(req: Request, res: Response) {
  const user = requireAuthUser(req);
  const { id } = req.params as { id: string };
  const item = await notificationService.markAsRead(user.id, id);
  return ok(res, { notification: item }, { message: "Notification marked as read" });
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  const user = requireAuthUser(req);
  const data = await notificationService.markAllAsRead(user.id);
  return ok(res, data, { message: "All notifications marked as read" });
}

export async function dismissNotification(req: Request, res: Response) {
  const user = requireAuthUser(req);
  const { id } = req.params as { id: string };
  const item = await notificationService.dismissNotification(user.id, id);
  return ok(res, { notification: item }, { message: "Notification dismissed" });
}

export async function testNotification(req: Request, res: Response) {
  const user = requireAuthUser(req);
  if (!env.ENABLE_DEV_TEST_ENDPOINTS) {
    throw new AppError({
      statusCode: 404,
      message: "Test notification endpoint is disabled"
    });
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
    throw new AppError({ statusCode: 403, message: "Forbidden" });
  }
  const body = req.body as NotificationTestBody;
  await notificationService.notifyUser({
    userId: body.userId ?? user.id,
    type: body.type,
    title: body.title,
    message: body.message,
    payload: body.payload,
    channels: body.channels
  });
  return created(res, { queued: true }, { message: "Test notification created" });
}
