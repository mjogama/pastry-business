import { randomInt } from "node:crypto";

import type { Product } from "@common/modules/product";
import { DEFAULT_SETTINGS } from "../menu/menu.service";
import type { PreOrderMailer } from "./pre-order.mailer";
import type { MenuRepository } from "../menu/menu.repository";
import type { PreOrderRepository } from "./pre-order.repository";
import type { ProductsRepository } from "../products/products.repository";
import { BadRequestError, ConflictError, NotFoundError } from "@shared/errors/AppError";
import type {
  DayKey,
  PreOrder,
  PreOrderItem,
  ListPreOrdersQuery,
  CreatePreOrderInput,
  UpdatePreOrderStatusInput,
} from "./pre-order.schema";

/** Manila is UTC+8 all year (no daylight saving). */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** How far ahead a hand-over day can be. */
export const MAX_DAYS_AHEAD = 14;

/** No 0/O or 1/I, so a code read aloud or copied by hand is never ambiguous. */
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

const manilaNow = (now: Date) => new Date(now.getTime() + MANILA_OFFSET_MS).toISOString();

export const addDays = (day: DayKey, days: number): DayKey =>
  new Date(new Date(`${day}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

export const isWeekday = (day: DayKey) => {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return weekday !== 0 && weekday !== 6;
};

/** The product's price per piece on `day`: the sale applies while `day` ≤ `discountEndsAt` (as on the menu). */
export const priceOn = (product: Pick<Product, "price" | "discountPrice" | "discountEndsAt">, day: DayKey) => {
  const { price, discountPrice, discountEndsAt } = product;
  const onSale =
    discountPrice != null && discountPrice > 0 && discountPrice < price && (!discountEndsAt || day <= discountEndsAt);
  return onSale ? Math.round((price - discountPrice) * 100) / 100 : price;
};

const newCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

export class PreOrderService {
  constructor(
    private readonly repository: PreOrderRepository,
    private readonly products: Pick<ProductsRepository, "findById">,
    private readonly settings: Pick<MenuRepository, "findSettings">,
    private readonly mailer: PreOrderMailer,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  list(query: ListPreOrdersQuery = {}): Promise<PreOrder[]> {
    return this.repository.findAll(query);
  }

  async getById(id: string): Promise<PreOrder> {
    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundError(`Pre-order ${id} not found`);
    return order;
  }

  async create({ website, items, ...input }: CreatePreOrderInput): Promise<PreOrder> {
    if (website) throw new BadRequestError("Your pre-order couldn’t be sent.");
    const settings = (await this.settings.findSettings()) ?? DEFAULT_SETTINGS;
    if (!settings.preOrdersOpen) throw new ConflictError("We’re not taking pre-orders right now.");
    this.assertPickupDate(input.pickupDate);

    const order = await this.repository.create({
      ...input,
      note: input.note ?? "",
      code: await this.uniqueCode(),
      items: await this.priceItems(items, input.pickupDate),
    });
    void this.mailer.send("placed", order, settings.businessName);
    return order;
  }

  async updateStatus(id: string, { status, reason }: UpdatePreOrderStatusInput): Promise<PreOrder> {
    const current = await this.getById(id);
    const allowedFrom = { confirmed: ["pending"], completed: ["confirmed"], cancelled: ["pending", "confirmed"] }[
      status
    ];
    if (!allowedFrom.includes(current.status)) {
      throw new ConflictError(`A ${current.status} pre-order can’t be ${status}.`);
    }

    const updated =
      status === "completed"
        ? await this.repository.complete(id, {
            date: manilaNow(this.clock()).slice(0, 16),
            title: `Pre-order ${current.code}`,
            note: `${current.customerName} · ${current.handoff}`,
          })
        : await this.repository.setStatus(id, current.status, status, reason || undefined);
    if (!updated) throw new ConflictError("This pre-order was just changed. Reload and try again.");

    if (status !== "completed") {
      const settings = (await this.settings.findSettings()) ?? DEFAULT_SETTINGS;
      void this.mailer.send(status, updated, settings.businessName);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const order = await this.getById(id);
    if (order.status !== "cancelled") throw new ConflictError("Only a cancelled pre-order can be deleted.");
    await this.repository.delete(id);
  }

  /** A weekday from tomorrow (Manila) up to `MAX_DAYS_AHEAD` days ahead. */
  private assertPickupDate(day: DayKey) {
    const today = manilaNow(this.clock()).slice(0, 10);
    if (day <= today) throw new BadRequestError("Pick a day from tomorrow onward.");
    if (day > addDays(today, MAX_DAYS_AHEAD)) {
      throw new BadRequestError(`Pick a day within the next ${MAX_DAYS_AHEAD} days.`);
    }
    if (!isWeekday(day)) throw new BadRequestError("Pick a school day (Monday to Friday).");
  }

  /** Merges repeated products (and sizes) and copies each one's name and price on the hand-over day. */
  private async priceItems(items: CreatePreOrderInput["items"], day: DayKey): Promise<PreOrderItem[]> {
    const lines = new Map<string, { productId: string; variant: string | undefined; quantity: number }>();
    for (const { productId, variant, quantity } of items) {
      const key = `${productId}\u0000${variant?.toLowerCase() ?? ""}`;
      lines.set(key, { productId, variant, quantity: (lines.get(key)?.quantity ?? 0) + quantity });
    }
    const priced: PreOrderItem[] = [];
    for (const { productId, variant, quantity } of lines.values()) {
      const product = await this.products.findById(productId);
      if (!product || product.isArchived) throw new BadRequestError("An item in your bag is no longer on the menu.");
      const size = this.pickSize(product, variant);
      const name = size ? `${product.name} (${size.name})` : product.name;
      if (!(size ?? product).isAvailable) throw new BadRequestError(`${name} is out of stock right now.`);
      if (quantity > 50) throw new BadRequestError(`At most 50 of ${name}.`);
      const price = size
        ? priceOn({ ...size, ...(product.discountEndsAt && { discountEndsAt: product.discountEndsAt }) }, day)
        : priceOn(product, day);
      priced.push({ productId, productName: name, price, quantity });
    }
    return priced;
  }

  /** The size asked for: required when the product has sizes, refused when it has none. */
  private pickSize(product: Product, variant: string | undefined) {
    const sizes = product.variants ?? [];
    if (sizes.length === 0) {
      if (variant !== undefined) throw new BadRequestError(`${product.name} doesn’t come in sizes.`);
      return undefined;
    }
    if (variant === undefined) throw new BadRequestError(`Pick a size for ${product.name}.`);
    const size = sizes.find((v) => v.name.toLowerCase() === variant.toLowerCase());
    if (!size) throw new BadRequestError(`${product.name} no longer comes in ${variant}.`);
    return size;
  }

  private async uniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newCode();
      if (!(await this.repository.codeExists(code))) return code;
    }
    throw new ConflictError("Couldn’t place the pre-order. Please try again.");
  }
}
