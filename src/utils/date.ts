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
const hasTimezoneSuffix = (value: string) => /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
const dateFieldPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const timeFieldPattern = /^(\d{2}):(\d{2})$/;

export const formatUtcDateTimeToLocal = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "";
  const utcLikeValue = hasTimezoneSuffix(normalized) ? normalized : `${normalized}Z`;
  const date = new Date(utcLikeValue);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const localDateTimeFieldsToUtcIso = (dateField: string, timeField: string) => {
  const dateMatch = dateFieldPattern.exec(dateField.trim());
  const timeMatch = timeFieldPattern.exec(timeField.trim());
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const localDate = new Date(year, month - 1, day, hour, minute, 0);
  if (Number.isNaN(localDate.getTime())) return null;
  return localDate.toISOString();
};

export const utcDateTimeToLocalFields = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return { date: "", time: "" };
  const utcLikeValue = hasTimezoneSuffix(normalized) ? normalized : `${normalized}Z`;
  const date = new Date(utcLikeValue);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
};

export const formatDate = (value: string) => {
  const normalized = value.trim();

  // Treat ISO-like date values as calendar dates, not timezone-shifted timestamps.
  // This prevents UTC-midnight values (e.g. 2026-04-26T00:00:00Z) from rendering as the prior day.
  const isoDatePrefix = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(normalized);
  if (isoDatePrefix) {
    const year = Number(isoDatePrefix[1]);
    const month = Number(isoDatePrefix[2]);
    const day = Number(isoDatePrefix[3]);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, { timeZone: "UTC" });
  }
  return new Date(normalized).toLocaleDateString();
};
