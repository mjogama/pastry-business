import db from "@app/config/db";
import type { Prisma } from "../../generated/prisma/client";
import type {
  DayKey,
  SalesEntry,
  LocalDateTime,
  CreateSalesEntryInput,
  UpdateSalesEntryInput,
} from "./sales-entry.schema";

/**
 * `sales_entries.date` is a timestamp without a time zone holding Manila wall-clock time, so it is
 * written and read as if it were UTC: `2026-11-23T08:30` is stored as `2026-11-23 08:30:00`.
 */
const toDbDate = (date: LocalDateTime) => new Date(`${date}:00.000Z`);
const fromDbDate = (date: Date): LocalDateTime => date.toISOString().slice(0, 16);

const include = { items: { orderBy: { position: "asc" } } } satisfies Prisma.SalesEntryInclude;

type SalesEntryRow = Prisma.SalesEntryGetPayload<{ include: typeof include }>;

const toSalesEntry = (row: SalesEntryRow): SalesEntry => ({
  id: row.id,
  date: fromDbDate(row.date),
  title: row.title,
  note: row.note,
  items: row.items.map((item) => ({
    productName: item.productName,
    price: item.price.toNumber(),
    quantity: item.quantity,
  })),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/** Nested `create` data for the items; `position` keeps the order they were sent in. */
const toItemsCreate = (items: CreateSalesEntryInput["items"]) =>
  items.map(({ productName, price, quantity }, position) => ({ position, productName, price, quantity }));

/** One sold product line with the date of its entry, for building product suggestions. */
export interface ProductSale {
  productName: string;
  price: number;
  date: LocalDateTime;
}

export interface SalesEntryRepository {
  /** Entries between two Manila days (both inclusive, either open), by date then creation. */
  findAll(from?: DayKey, to?: DayKey): Promise<SalesEntry[]>;
  findById(id: string): Promise<SalesEntry | null>;
  /** Every sold product line, newest entry date first. */
  findProductSales(): Promise<ProductSale[]>;
  create(input: CreateSalesEntryInput): Promise<SalesEntry>;
  update(id: string, input: UpdateSalesEntryInput): Promise<SalesEntry>;
  delete(id: string): Promise<void>;
}

export class PrismaSalesEntryRepository implements SalesEntryRepository {
  async create(input: CreateSalesEntryInput): Promise<SalesEntry> {
    const row = await db.salesEntry.create({
      data: {
        date: toDbDate(input.date),
        title: input.title,
        note: input.note,
        items: { create: toItemsCreate(input.items) },
      },
      include,
    });
    return toSalesEntry(row);
  }

  /** Replaces the entry: old items are deleted and recreated. */
  async update(id: string, input: UpdateSalesEntryInput): Promise<SalesEntry> {
    const row = await db.salesEntry.update({
      where: { id },
      data: {
        date: toDbDate(input.date),
        title: input.title,
        note: input.note,
        items: { deleteMany: {}, create: toItemsCreate(input.items) },
      },
      include,
    });
    return toSalesEntry(row);
  }

  async delete(id: string): Promise<void> {
    await db.salesEntry.delete({ where: { id } });
  }

  async findAll(from?: DayKey, to?: DayKey): Promise<SalesEntry[]> {
    const rows = await db.salesEntry.findMany({
      where: {
        date: {
          ...(from && { gte: toDbDate(`${from}T00:00`) }),
          ...(to && { lte: toDbDate(`${to}T23:59`) }),
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include,
    });
    return rows.map(toSalesEntry);
  }

  async findById(id: string): Promise<SalesEntry | null> {
    const row = await db.salesEntry.findUnique({ where: { id }, include });
    return row ? toSalesEntry(row) : null;
  }

  async findProductSales(): Promise<ProductSale[]> {
    const rows = await db.salesItem.findMany({
      select: { productName: true, price: true, salesEntry: { select: { date: true } } },
      orderBy: [{ salesEntry: { date: "desc" } }, { salesEntry: { createdAt: "desc" } }],
    });
    return rows.map((row) => ({
      productName: row.productName,
      price: row.price.toNumber(),
      date: fromDbDate(row.salesEntry.date),
    }));
  }
}
