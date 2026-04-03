import { env } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";
import type {
  NotificationProviderResult,
  NotificationProviderSendInput
} from "../notification.types.js";

export async function sendEmail(
  input: NotificationProviderSendInput
): Promise<NotificationProviderResult> {
  if (env.NODE_ENV !== "production") {
    logger.info("Email notification stub send", {
      to: input.to,
      subject: input.subject,
      preview: input.message.slice(0, 120),
      meta: input.meta
    });
    return { ok: true, providerMessageId: "stub-email" };
  }

  logger.warn("Email provider not configured in production", { to: input.to });
  return { ok: false, error: "Email provider not configured" };
}
