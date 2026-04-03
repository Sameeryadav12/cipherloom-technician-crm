import type {
  NotificationProviderResult,
  NotificationProviderSendInput
} from "../notification.types.js";

export async function sendInAppNotification(
  _input: NotificationProviderSendInput
): Promise<NotificationProviderResult> {
  return { ok: true };
}
