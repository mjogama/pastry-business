import db from "@app/config/db";
import type { Prisma } from "../../generated/prisma/client";
import type { DayKey, PreOrder, PreOrderItem, PreOrderStatus, ListPreOrdersQuery } from "./pre-order.schema";

/** `pickupDate` is a `DATE` column: a calendar day, read and written as UTC midnight. */
const toDbDay = (day: DayKey) => new Date(`${day}T00:00:00.000Z`);
const fromDbDay = (date: Date): DayKey => date.toISOString().slice(0, 10);

const include = { items: { orderBy: { position: "asc" } } } satisfies Prisma.PreOrderInclude;

type PreOrderRow = Prisma.PreOrderGetPayload<{ include: typeof include }>;

const toPreOrder = (row: PreOrderRow): PreOrder => ({
  id: row.id,
  code: row.code,
  customerName: row.customerName,
  email: row.email,
  contactNumber: row.contactNumber,
  handoff: row.handoff,
  pickupDate: fromDbDay(row.pickupDate),
  note: row.note,
  status: row.status,
  ...(row.cancelReason !== null && { cancelReason: row.cancelReason }),
  items: row.items.map((item) => ({
    ...(item.productId !== null && { productId: item.productId }),
    productName: item.productName,
    price: item.price.toNumber(),
    quantity: item.quantity,
  })),
  ...(row.salesEntryId !== null && { salesEntryId: row.salesEntryId }),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/** What the service stores for a new order: prices already worked out from the products. */
export interface NewPreOrder {
  code: string;
  customerName: string;
  email: string;
  contactNumber: string;
  pickupDate: DayKey;
  note: string;
  items: PreOrderItem[];
}

/** The Sales Tracker entry made when an order is completed. */
export interface CompletionEntry {
  /** Manila wall-clock time, `YYYY-MM-DDTHH:mm`. */
  date: string;
  title: string;
  note: string;
}

export interface PreOrderRepository {
  /** By hand-over day, then creation. */
  findAll(query?: ListPreOrdersQuery): Promise<PreOrder[]>;
  findById(id: string): Promise<PreOrder | null>;
  codeExists(code: string): Promise<boolean>;
  create(input: NewPreOrder): Promise<PreOrder>;
  /** Sets the status only if it is still `from`; null when another request changed it first. */
  setStatus(id: string, from: PreOrderStatus, to: PreOrderStatus, cancelReason?: string): Promise<PreOrder | null>;
  /** Marks a confirmed order completed and creates its Sales Tracker entry in one transaction. */
  complete(id: string, entry: CompletionEntry): Promise<PreOrder | null>;
  delete(id: string): Promise<void>;
}

export class PrismaPreOrderRepository implements PreOrderRepository {
  async findAll({ from, to, status }: ListPreOrdersQuery = {}): Promise<PreOrder[]> {
    const rows = await db.preOrder.findMany({
      where: {
        ...(status && { status }),
        pickupDate: { ...(from && { gte: toDbDay(from) }), ...(to && { lte: toDbDay(to) }) },
      },
      orderBy: [{ pickupDate: "asc" }, { createdAt: "asc" }],
      include,
    });
    return rows.map(toPreOrder);
  }

  async findById(id: string): Promise<PreOrder | null> {
    const row = await db.preOrder.findUnique({ where: { id }, include });
    return row && toPreOrder(row);
  }

  async codeExists(code: string): Promise<boolean> {
    return (await db.preOrder.count({ where: { code } })) > 0;
  }

  async create({ pickupDate, items, ...input }: NewPreOrder): Promise<PreOrder> {
    const row = await db.preOrder.create({
      data: {
        ...input,
        pickupDate: toDbDay(pickupDate),
        items: {
          create: items.map(({ productId, productName, price, quantity }, position) => ({
            position,
            productId: productId ?? null,
            productName,
            price,
            quantity,
          })),
        },
      },
      include,
    });
    return toPreOrder(row);
  }

  async setStatus(
    id: string,
    from: PreOrderStatus,
    to: PreOrderStatus,
    cancelReason?: string,
  ): Promise<PreOrder | null> {
    const { count } = await db.preOrder.updateMany({
      where: { id, status: from },
      data: { status: to, ...(cancelReason !== undefined && { cancelReason }) },
    });
    return count === 0 ? null : this.findById(id);
  }

  async complete(id: string, entry: CompletionEntry): Promise<PreOrder | null> {
    return db.$transaction(async (tx) => {
      const { count } = await tx.preOrder.updateMany({
        where: { id, status: "confirmed" },
        data: { status: "completed" },
      });
      if (count === 0) return null;
      const order = await tx.preOrder.findUniqueOrThrow({ where: { id }, include });
      // Sales entry dates are Manila wall-clock time stored as if UTC (see the sales-entry repository).
      const salesEntry = await tx.salesEntry.create({
        data: {
          date: new Date(`${entry.date}:00.000Z`),
          title: entry.title,
          note: entry.note,
          items: {
            create: order.items.map(({ productName, price, quantity }, position) => ({
              position,
              productName,
              price,
              quantity,
            })),
          },
        },
      });
      return toPreOrder(await tx.preOrder.update({ where: { id }, data: { salesEntryId: salesEntry.id }, include }));
    });
  }

  async delete(id: string): Promise<void> {
    await db.preOrder.delete({ where: { id } });
  }
}
