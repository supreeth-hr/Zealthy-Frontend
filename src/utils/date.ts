import { Frequency } from "../services/types";

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const isWithinNextSevenDays = (isoLikeDate: string, now = Date.now()) => {
  const target = new Date(isoLikeDate).getTime();
  return target >= now && target <= now + SEVEN_DAYS_MS;
};

export const isWithinThreeMonths = (isoLikeDate: string, now = Date.now()) => {
  const target = new Date(isoLikeDate).getTime();
  return target >= now && target <= now + THREE_MONTHS_MS;
};

const advance = (date: Date, frequency: Frequency) => {
  const next = new Date(date);
  if (frequency === "daily") next.setDate(next.getDate() + 1);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next;
};

export const expandRecurringDateTimes = (startIso: string, repeat: Frequency) => {
  const results: string[] = [];
  const now = Date.now();
  const max = now + THREE_MONTHS_MS;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return results;

  if (repeat === "none") {
    if (isWithinThreeMonths(startIso, now)) results.push(start.toISOString());
    return results;
  }

  for (let cursor = new Date(start); cursor.getTime() <= max; cursor = advance(cursor, repeat)) {
    if (cursor.getTime() >= now) {
      results.push(cursor.toISOString());
    }
  }

  return results;
};

export const expandRecurringDates = (startIsoDate: string, repeat: Frequency) => {
  const results: string[] = [];
  const now = Date.now();
  const max = now + THREE_MONTHS_MS;
  const start = new Date(startIsoDate);
  if (Number.isNaN(start.getTime())) return results;

  if (repeat === "none") {
    if (isWithinThreeMonths(startIsoDate, now)) results.push(start.toISOString().slice(0, 10));
    return results;
  }

  for (let cursor = new Date(start); cursor.getTime() <= max; cursor = advance(cursor, repeat)) {
    if (cursor.getTime() >= now) {
      results.push(cursor.toISOString().slice(0, 10));
    }
  }

  return results;
};

export const formatDateTime = (value: string) => new Date(value).toLocaleString();
export const formatDate = (value: string) => {
  // Treat YYYY-MM-DD as a calendar date, not a timezone-shifted timestamp.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, { timeZone: "UTC" });
  }
  return new Date(value).toLocaleDateString();
};
