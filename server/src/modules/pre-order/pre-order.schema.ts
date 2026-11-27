import { z } from "zod";

import { dayKey, money } from "@shared/validation/primitives";
import type {
  PreOrder,
  PreOrderItem,
  PreOrderStatus,
  ListPreOrdersQuery,
  CreatePreOrderInput,
  UpdatePreOrderStatusInput,
} from "@common/modules/pre-order";

export type {
  DayKey,
  PreOrder,
  PreOrderItem,
  PreOrderStatus,
  ListPreOrdersQuery,
  CreatePreOrderInput,
  UpdatePreOrderStatusInput,
} from "@common/modules/pre-order";

export const MAX_ITEMS = 20;
export const MAX_QUANTITY = 50;

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const satisfies readonly PreOrderStatus[];

const status = z.enum(STATUSES);

const itemSchema = z.object({
  productId: z.uuid().exactOptional(),
  productName: z.string().min(1),
  price: money,
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
}) satisfies z.ZodType<PreOrderItem>;

export const preOrderSchema = z.object({
  id: z.uuid(),
  code: z.string().length(6),
  customerName: z.string(),
  email: z.email(),
  handoff: z.string(),
  pickupDate: dayKey,
  note: z.string(),
  status,
  cancelReason: z.string().exactOptional(),
  items: z.array(itemSchema),
  salesEntryId: z.uuid().exactOptional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}) satisfies z.ZodType<PreOrder>;

export const createPreOrderSchemas = {
  body: z.object({
    customerName: z.string().trim().min(1, "Enter your name").max(60),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email").max(254)),
    handoff: z.string().trim().min(1, "Enter your grade and section").max(80),
    pickupDate: dayKey,
    note: z.string().trim().max(300).default(""),
    items: z
      .array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(MAX_QUANTITY) }))
      .min(1, "Add at least one item")
      .max(MAX_ITEMS, `At most ${MAX_ITEMS} items`),
    website: z.string().exactOptional(),
  }) satisfies z.ZodType<CreatePreOrderInput>,
};

export const listPreOrdersSchemas = {
  query: z
    .object({ from: dayKey.exactOptional(), to: dayKey.exactOptional(), status: status.exactOptional() })
    .refine(({ from, to }) => !from || !to || from <= to, {
      message: "`from` must not be after `to`",
      path: ["to"],
    }) satisfies z.ZodType<ListPreOrdersQuery>,
};

const idParams = z.object({ id: z.uuid() });

export const getPreOrderSchemas = { params: idParams };

export const deletePreOrderSchemas = { params: idParams };

export const updatePreOrderStatusSchemas = {
  params: idParams,
  body: z
    .object({
      status: z.enum(["confirmed", "completed", "cancelled"]),
      reason: z.string().trim().max(200).exactOptional(),
    })
    .refine(({ status, reason }) => reason === undefined || status === "cancelled", {
      message: "A reason is only for cancelling",
      path: ["reason"],
    }) satisfies z.ZodType<UpdatePreOrderStatusInput>,
};
