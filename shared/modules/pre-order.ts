// Contract for /api/v1/pre-orders. The server's Zod schemas are checked against these types.

/** Calendar day in Asia/Manila, `YYYY-MM-DD`. */
export type DayKey = string;

/** `pending` → `confirmed` → `completed`; `pending` or `confirmed` → `cancelled`. */
export type PreOrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface PreOrderItem {
  /** Missing once the product has been deleted; the name and price stay. */
  productId?: string;
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
  /** Grade & section, or where to find the customer at school. 1–80 characters. */
  handoff: string;
  /** Hand-over day: a weekday, tomorrow (Manila) or later. */
  pickupDate: DayKey;
  /** Up to 300 characters, may be empty. */
  note: string;
  status: PreOrderStatus;
  /** Set when the owner gave one while cancelling. */
  cancelReason?: string;
  /** 1–20 lines, one per product. */
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
  quantity: number;
}

/** `POST /pre-orders` (public). Prices come from the products, never from the client. */
export interface CreatePreOrderInput {
  customerName: string;
  email: string;
  handoff: string;
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

/** `PUT /menu/settings/pre-orders`. */
export interface UpdatePreOrdersOpenInput {
  open: boolean;
}
