type LogMeta = Record<string, unknown>;

function formatMeta(meta?: LogMeta) {
  if (!meta || Object.keys(meta).length === 0) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [meta:unserializable]";
  }
}

function ts() {
  return new Date().toISOString();
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(`[${ts()}] INFO  ${message}${formatMeta(meta)}`);
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(`[${ts()}] WARN  ${message}${formatMeta(meta)}`);
  },
  error(message: string, meta?: LogMeta) {
    console.error(`[${ts()}] ERROR ${message}${formatMeta(meta)}`);
  }
};

