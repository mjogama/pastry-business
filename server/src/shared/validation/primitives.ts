import { z } from "zod";

/** `YYYY-MM-DD` that is a real calendar day. */
export const isDayKey = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(day.getTime()) && day.toISOString().startsWith(value);
};

export const dayKey = z.string().refine(isDayKey, "Must be a date as YYYY-MM-DD");

const hasAtMostTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

/** Matches `DECIMAL(10, 2)` columns. */
export const money = z.number().positive().max(99_999_999.99).refine(hasAtMostTwoDecimals, "At most 2 decimals");

/** Images are served by Cloudinary only; `next/image` on the client allows no other host. */
export const cloudinaryUrl = z
  .url({ protocol: /^https$/ })
  .refine((value) => new URL(value).hostname === "res.cloudinary.com", "Must be a Cloudinary image URL");
