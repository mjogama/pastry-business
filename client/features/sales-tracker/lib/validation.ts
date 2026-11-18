import type { LocalDateTime, SalesEntryInput } from "../types";
import { isLocalDateTime } from "./dates";

export const TITLE_MAX_LENGTH = 60;

/**
 * §4 rules in order: date → title → each product (name → price > 0 → qty ≥ 1).
 * Returns the first error only, or null when the entry can be saved.
 * The form calls it before saving and the store calls it again before writing,
 * so the rule holds wherever an entry comes from.
 */
export const firstEntryError = (input: SalesEntryInput, now: LocalDateTime): string | null => {
  if (!isLocalDateTime(input.date)) return "Please pick a date and time.";
  if (input.date > now) return "The date can’t be in the future.";

  const title = input.title.trim();
  if (!title) return "Please add a title for this entry.";
  if (title.length > TITLE_MAX_LENGTH) return `Keep the title to ${TITLE_MAX_LENGTH} characters or fewer.`;

  if (input.items.length === 0) return "Please add at least one product.";
  for (const [index, item] of input.items.entries()) {
    const name = item.productName.trim();
    if (!name) return `Product ${index + 1} needs a name.`;
    if (!Number.isFinite(item.price) || item.price <= 0) return `${name} needs a price above ₱0.`;
    if (!Number.isInteger(item.quantity) || item.quantity < 1) return `${name} needs a quantity of at least 1.`;
  }
  return null;
};

/** Trims text fields the same way on every write. */
export const normalizeEntryInput = (input: SalesEntryInput): SalesEntryInput => ({
  date: input.date,
  title: input.title.trim(),
  note: input.note.trim(),
  items: input.items.map((item) => ({ ...item, productName: item.productName.trim() })),
});

export const entryValidationError = (message: string) =>
  Object.assign(new Error(message), { name: "EntryValidationError" });

export const isEntryValidationError = (error: unknown): error is Error =>
  error instanceof Error && error.name === "EntryValidationError";
