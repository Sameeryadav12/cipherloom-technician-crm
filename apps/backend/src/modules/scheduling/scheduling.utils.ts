import { intervalsOverlap } from "../calendar/calendar.utils.js";

export const SLOT_INCREMENT_MINUTES = 30;
export const DEFAULT_WINDOW_DAYS = 7;
export const WORKDAY_START_HOUR = 9;
export const WORKDAY_END_HOUR = 17;

export function normalizeSkills(skills: string[]) {
  return skills.map((s) => s.trim().toLowerCase());
}

export function technicianMatchesAllSkills(
  technicianSkills: string[],
  requiredSkills: string[]
) {
  if (requiredSkills.length === 0) return true;
  const haystack = new Set(normalizeSkills(technicianSkills));
  return normalizeSkills(requiredSkills).every((skill) => haystack.has(skill));
}

export function isWeekday(date: Date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

export function isInsideDefaultWorkingWindow(start: Date, end: Date) {
  if (!isWeekday(start) || !isWeekday(end)) return false;
  if (start.toDateString() !== end.toDateString()) return false;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const minMinutes = WORKDAY_START_HOUR * 60;
  const maxMinutes = WORKDAY_END_HOUR * 60;

  return startMinutes >= minMinutes && endMinutes <= maxMinutes && end > start;
}

export function floorToMinuteStep(date: Date, minuteStep: number) {
  const d = new Date(date);
  const mins = d.getMinutes();
  const floored = mins - (mins % minuteStep);
  d.setMinutes(floored, 0, 0);
  return d;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function buildDefaultSearchWindow(now = new Date(), days = DEFAULT_WINDOW_DAYS) {
  const start = new Date(now);
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return { start, end };
}

export function generateCandidateSlots(input: {
  searchStart: Date;
  searchEnd: Date;
  durationMinutes: number;
  stepMinutes?: number;
}) {
  const step = input.stepMinutes ?? SLOT_INCREMENT_MINUTES;
  const slots: Array<{ start: Date; end: Date }> = [];
  let cursor = floorToMinuteStep(input.searchStart, step);

  while (cursor < input.searchEnd) {
    const start = new Date(cursor);
    if (start < input.searchStart) {
      cursor = addMinutes(cursor, step);
      continue;
    }

    const end = addMinutes(start, input.durationMinutes);
    if (end > input.searchEnd) break;
    if (isInsideDefaultWorkingWindow(start, end)) {
      slots.push({ start, end });
    }
    cursor = addMinutes(cursor, step);
  }

  return slots;
}

export function slotOverlapsAny(
  slot: { start: Date; end: Date },
  intervals: Array<{ start: Date; end: Date }>
) {
  return intervals.some((it) =>
    intervalsOverlap(slot.start, slot.end, it.start, it.end)
  );
}

