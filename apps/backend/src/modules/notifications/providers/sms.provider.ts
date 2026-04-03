import { env } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";
import type {
  NotificationProviderResult,
  NotificationProviderSendInput
} from "../notification.types.js";

export async function sendSms(
  input: NotificationProviderSendInput
): Promise<NotificationProviderResult> {
  if (env.NODE_ENV !== "production") {
    logger.info("SMS notification stub send", {
      to: input.to,
      preview: input.message.slice(0, 120),
      meta: input.meta
    });
    return { ok: true, providerMessageId: "stub-sms" };
  }

  logger.warn("SMS provider not configured in production", { to: input.to });
  return { ok: false, error: "SMS provider not configured" };
}
