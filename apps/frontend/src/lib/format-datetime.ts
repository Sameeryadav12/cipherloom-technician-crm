/** Shared date/time formatting for operational UI. */

export function formatShortDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatShortDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

/** Human-readable relative hint for recent timestamps (operational context). */
export function formatRelativeHint(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 0) return "Upcoming";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatShortDate(value);
}

export function isOverdueDueDate(dueAt?: string | null, status?: string): boolean {
  if (!dueAt || status === "PAID" || status === "VOID") return false;
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return false;
  return due < Date.now();
}

export function isDueWithinDays(days: number, dueAt?: string | null, status?: string): boolean {
  if (!dueAt || status === "PAID" || status === "VOID") return false;
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return false;
  const end = Date.now() + days * 86_400_000;
  return due >= Date.now() && due <= end;
}
