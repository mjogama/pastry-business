/** Local wall-clock date and time in Asia/Manila, `YYYY-MM-DDTHH:mm`. */
export type LocalDateTime = string;

/** Calendar day in Asia/Manila, `YYYY-MM-DD`. */
export type DayKey = string;

export interface SalesItem {
  /** Required, trimmed. */
  productName: string;
  /** PHP, > 0, up to 2 decimals. */
  price: number;
  /** Integer ≥ 1. */
  quantity: number;
}

export interface SalesEntry {
  id: string;
  /** Not in the future. */
  date: LocalDateTime;
  /** 1–60 characters, trimmed. */
  title: string;
  /** At least one item. */
  items: SalesItem[];
  /** Trimmed, may be empty. */
  note: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

export interface ListSalesEntriesQuery {
  /** Inclusive first day. */
  from?: DayKey;
  /** Inclusive last day. */
  to?: DayKey;
}

/** What the entry popover submits, for create and edit alike. */
export type CreateSalesEntryInput = Omit<SalesEntry, "id" | "createdAt" | "updatedAt">;

/** `PUT /sales-entries/:id` replaces the whole entry. */
export type UpdateSalesEntryInput = CreateSalesEntryInput;

/** `GET /sales-entries/product-suggestions`: each product name with its most recent price by entry date, sorted by name. */
export interface ProductSuggestion {
  productName: string;
  price: number;
}
