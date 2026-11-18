import type { DayKey } from "../types";

/** Fixed-date Philippine holidays (§4), keyed by `MM-DD`. Same list as the reference prototype. */
const FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "New Year's Day",
  "04-09": "Araw ng Kagitingan",
  "05-01": "Labor Day",
  "06-12": "Independence Day",
  "08-21": "Ninoy Aquino Day",
  "11-01": "All Saints' Day",
  "11-02": "All Souls' Day",
  "11-30": "Bonifacio Day",
  "12-08": "Immaculate Conception",
  "12-24": "Christmas Eve",
  "12-25": "Christmas Day",
  "12-30": "Rizal Day",
  "12-31": "New Year's Eve",
};

export const holidayOf = (key: DayKey): string | undefined => FIXED_HOLIDAYS[key.slice(5)];
