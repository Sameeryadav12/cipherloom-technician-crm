type ErrorContext = Record<string, unknown>;

export function reportError(error: unknown, context?: ErrorContext) {
  // Adapter point for Sentry/Datadog/NewRelic in production.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error("[app-error]", error, context ?? {});
  }
}
