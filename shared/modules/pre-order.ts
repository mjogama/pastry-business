// Contract for /api/v1/pre-orders. The server's Zod schemas are checked against these types.

/** Calendar day in Asia/Manila, `YYYY-MM-DD`. */
export type DayKey = string;

/** `pending` → `confirmed` → `completed`; `pending` or `confirmed` → `cancelled`. */
export type PreOrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface PreOrderItem {
  /** Missing once the product has been deleted; the name and price stay. */
  productId?: string;
  /** With the size for a product with sizes, e.g. `Ube Cake (Large)`. */
  productName: string;
  /** PHP per piece on the hand-over day, copied when the order was placed. */
  price: number;
  /** Integer 1–50. */
  quantity: number;
}

export interface PreOrder {
  id: string;
  /** 6 characters, e.g. `K7M3QX`. Unique. */
  code: string;
  /** 1–60 characters. */
  customerName: string;
  email: string;
  /** Phone number to reach the customer, up to 20 characters. Empty on orders placed before it was asked. */
  contactNumber: string;
  /** Grade & section from orders placed before checkout stopped asking; `""` on newer orders. */
  handoff: string;
  /** Hand-over day: one of the owner's selling weekdays, from the cut-off on (Manila). */
  pickupDate: DayKey;
  /** Up to 300 characters, may be empty. */
  note: string;
  status: PreOrderStatus;
  /** Set when the owner gave one while cancelling. */
  cancelReason?: string;
  /** 1–20 lines, one per product (and size). */
  items: PreOrderItem[];
  /** The Sales Tracker entry made when the order was completed. */
  salesEntryId?: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

export interface CreatePreOrderItemInput {
  productId: string;
  /** The size's name; required for a product with sizes, refused for one without. */
  variant?: string;
  quantity: number;
}

/** `POST /pre-orders` (public). Prices come from the products, never from the client. */
export interface CreatePreOrderInput {
  customerName: string;
  email: string;
  /** 7–15 digits; spaces, dashes, dots, brackets and a leading + are allowed. */
  contactNumber: string;
  pickupDate: DayKey;
  note?: string;
  items: CreatePreOrderItemInput[];
  /** Honeypot: a hidden field people leave empty. Any value is refused. */
  website?: string;
}

export interface ListPreOrdersQuery {
  /** Inclusive first hand-over day. */
  from?: DayKey;
  /** Inclusive last hand-over day. */
  to?: DayKey;
  status?: PreOrderStatus;
}

/** `PATCH /pre-orders/:id/status`. */
export interface UpdatePreOrderStatusInput {
  status: Exclude<PreOrderStatus, "pending">;
  /** Only with `cancelled`; up to 200 characters, sent to the customer. */
  reason?: string;
}

/** `PUT /menu/settings/pre-orders`: any of these, at least one. See `BusinessSettings` for the rules. */
export interface UpdatePreOrderSettingsInput {
  open?: boolean;
  days?: number[];
  cutoffDays?: number;
  /** `HH:mm`, 24-hour, Manila. */
  cutoffTime?: string;
  handoffTime?: string;
}
