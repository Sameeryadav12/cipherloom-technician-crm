import { NotificationChannel, NotificationType } from "@prisma/client";
import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
}

const booleanQuery = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === "true" || value === "1" || value === true) return true;
  if (value === "false" || value === "0" || value === false) return false;
  return value;
}, z.boolean().optional());

export const listNotificationsQuerySchema = z.object({
  unreadOnly: booleanQuery.default(false),
  type: z.preprocess(emptyToUndefined, z.nativeEnum(NotificationType).optional()),
  channel: z.preprocess(emptyToUndefined, z.nativeEnum(NotificationChannel).optional()),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const notificationIdParamSchema = z.object({
  id: z.string().trim().min(1)
});

export const notificationTestBodySchema = z
  .object({
    userId: z.string().trim().min(1).optional(),
    type: z.nativeEnum(NotificationType).default(NotificationType.SYSTEM),
    title: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(2000),
    channels: z.array(z.nativeEnum(NotificationChannel)).optional(),
    payload: z.record(z.string(), z.unknown()).optional()
  })
  .strict();

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
export type NotificationTestBody = z.infer<typeof notificationTestBodySchema>;
