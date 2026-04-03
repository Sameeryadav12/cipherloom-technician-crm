import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { sensitiveActionRateLimit } from "../../middlewares/rate-limit.middleware.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validateRequest } from "../../utils/validate-request.js";
import * as notificationController from "./notification.controller.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  notificationTestBodySchema
} from "./notification.schemas.js";

export const notificationRouter = Router();

notificationRouter.use(
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.STAFF, UserRole.TECHNICIAN)
);

notificationRouter.get(
  "/",
  validateRequest({ query: listNotificationsQuerySchema }),
  asyncHandler(notificationController.listNotifications)
);

notificationRouter.get(
  "/unread-count",
  asyncHandler(notificationController.getUnreadCount)
);

notificationRouter.patch(
  "/read-all",
  asyncHandler(notificationController.markAllNotificationsRead)
);

notificationRouter.patch(
  "/:id/read",
  validateRequest({ params: notificationIdParamSchema }),
  asyncHandler(notificationController.markNotificationRead)
);

notificationRouter.patch(
  "/:id/dismiss",
  validateRequest({ params: notificationIdParamSchema }),
  asyncHandler(notificationController.dismissNotification)
);

notificationRouter.post(
  "/test",
  sensitiveActionRateLimit,
  validateRequest({ body: notificationTestBodySchema }),
  asyncHandler(notificationController.testNotification)
);
