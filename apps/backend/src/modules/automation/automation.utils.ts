import type { RecurrencePattern } from "@prisma/client";

export function nextRecurrenceDate(from: Date, pattern: RecurrencePattern) {
  const next = new Date(from);
  if (pattern === "DAILY") next.setDate(next.getDate() + 1);
  else if (pattern === "WEEKLY") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
