import { z } from "zod";

import type {
  SalesItem,
  SalesEntry,
  CreateSalesEntryInput,
  UpdateSalesEntryInput,
  ListSalesEntriesQuery,
} from "@common/modules/sales-entry";

export type {
  DayKey,
  LocalDateTime,
  ProductSuggestion,
  SalesEntry,
  CreateSalesEntryInput,
  UpdateSalesEntryInput,
} from "@common/modules/sales-entry";

export const TITLE_MAX_LENGTH = 60;

/** Matches `sales_items.price` (DECIMAL(10, 2)). */
const PRICE_MAX = 99_999_999.99;

/** `YYYY-MM-DD` that is a real calendar day. */
const isDayKey = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(day.getTime()) && day.toISOString().startsWith(value);
};

const dayKey = z.string().refine(isDayKey, "Must be a date as YYYY-MM-DD");

const localDateTime = z
  .string()
  .refine(
    (value) => /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value) && isDayKey(value.slice(0, 10)),
    "Must be a date and time as YYYY-MM-DDTHH:mm",
  );

const hasAtMostTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

const salesItemSchema = z.object({
  productName: z.string().trim().min(1, "Needs a name"),
  price: z.number().positive().max(PRICE_MAX).refine(hasAtMostTwoDecimals, "At most 2 decimals"),
  quantity: z.number().int().min(1).max(2_147_483_647),
}) satisfies z.ZodType<SalesItem>;

const entryInputSchema = z.object({
  date: localDateTime,
  title: z.string().trim().min(1).max(TITLE_MAX_LENGTH),
  items: z.array(salesItemSchema).min(1, "Add at least one product"),
  note: z.string().trim().default(""),
});

export const salesEntrySchema = entryInputSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}) satisfies z.ZodType<SalesEntry>;

export const listSalesEntriesSchemas = {
  query: z
    .object({ from: dayKey.exactOptional(), to: dayKey.exactOptional() })
    .refine(({ from, to }) => !from || !to || from <= to, {
      message: "`from` must not be after `to`",
      path: ["to"],
    }) satisfies z.ZodType<ListSalesEntriesQuery>,
};

const idParams = z.object({ id: z.uuid() });

export const getSalesEntrySchemas = {
  params: idParams,
};

export const createSalesEntrySchemas = {
  body: entryInputSchema satisfies z.ZodType<CreateSalesEntryInput>,
};

export const updateSalesEntrySchemas = {
  params: idParams,
  body: entryInputSchema satisfies z.ZodType<UpdateSalesEntryInput>,
};

export const deleteSalesEntrySchemas = {
  params: idParams,
};
