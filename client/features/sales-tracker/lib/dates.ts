import type { DayKey, LocalDateTime } from "../types";

/** Every date in the tracker is wall-clock time in Manila (§3), whatever the device's zone. */
export const TIME_ZONE = "Asia/Manila";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface YearMonth {
  year: number;
  /** 0-based, like Date. */
  month: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

const manilaParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Current Manila time as `YYYY-MM-DDTHH:mm`. */
export const toLocalDateTime = (instant: Date): LocalDateTime => {
  const parts = Object.fromEntries(manilaParts.formatToParts(instant).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const dayKeyOf = (dateTime: LocalDateTime): DayKey => dateTime.slice(0, 10);

export const timeOf = (dateTime: LocalDateTime): string => dateTime.slice(11, 16);

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** True for a real calendar date and time in `YYYY-MM-DDTHH:mm`. */
export const isLocalDateTime = (value: string): boolean => {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) return false;
  const [, y, m, d, h, min] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d && h < 24 && min < 60;
};

/** Day key → a UTC Date at midnight, for weekday and month arithmetic only. */
const utcDate = (key: DayKey) => new Date(`${key}T00:00:00Z`);

const keyFromUtc = (date: Date): DayKey =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

export const yearMonthOf = (key: DayKey): YearMonth => ({
  year: Number(key.slice(0, 4)),
  month: Number(key.slice(5, 7)) - 1,
});

export const monthPrefix = ({ year, month }: YearMonth) => `${year}-${pad(month + 1)}`;

export const addMonths = ({ year, month }: YearMonth, delta: number): YearMonth => {
  const date = new Date(Date.UTC(year, month + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
};

export interface GridDay {
  key: DayKey;
  dayOfMonth: number;
  month: number;
  inMonth: boolean;
}

/** Sunday-first grid with only as many weeks as the month needs (§7.3). */
export const monthGrid = ({ year, month }: YearMonth): GridDay[] => {
  const startDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weeks = Math.ceil((startDow + daysInMonth) / 7);
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(Date.UTC(year, month, 1 - startDow + index));
    return {
      key: keyFromUtc(date),
      dayOfMonth: date.getUTCDate(),
      month: date.getUTCMonth(),
      inMonth: date.getUTCMonth() === month,
    };
  });
};

/** `18`, or `Nov 1` on the first of a month, as in macOS Calendar (§7.3). */
/** Short weekday name of a day, e.g. "Mon". */
export const weekdayOf = (key: DayKey) => WEEKDAYS[new Date(`${key}T00:00:00Z`).getUTCDay()];

export const dayLabel = (day: GridDay) =>
  day.dayOfMonth === 1 ? `${MONTH_NAMES[day.month].slice(0, 3)} 1` : String(day.dayOfMonth);

const longDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** `Wednesday, November 18, 2026` */
export const formatLongDate = (key: DayKey) => longDate.format(utcDate(key));

const shortParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  month: "short",
  day: "2-digit",
  year: "numeric",
});

/** `Wed Nov 18 2026`, for cell aria-labels (§7.3). */
export const formatShortDate = (key: DayKey) => {
  const parts = Object.fromEntries(shortParts.formatToParts(utcDate(key)).map((part) => [part.type, part.value]));
  return `${parts.weekday} ${parts.month} ${parts.day} ${parts.year}`;
};

/** `HH:mm` → `8:30 AM` */
export const formatTime12 = (hhmm: string) => {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const suffix = hours < 12 ? "AM" : "PM";
  return `${hours % 12 === 0 ? 12 : hours % 12}:${pad(minutes)} ${suffix}`;
};

/** `mm-dd-yy · h:mm AM` (§4) */
export const formatEntryDateTime = (dateTime: LocalDateTime) => {
  if (!isLocalDateTime(dateTime)) return "";
  const [year, month, day] = dateTime.slice(0, 10).split("-");
  return `${month}-${day}-${year.slice(2)} · ${formatTime12(timeOf(dateTime))}`;
};

/** That day at the current time, clamped to now (§4). */
export const defaultDateTimeFor = (key: DayKey, now: LocalDateTime): LocalDateTime => {
  const candidate = `${key}T${timeOf(now)}`;
  return candidate > now ? now : candidate;
};
