import { randomUUID } from "node:crypto";
import type { ProductSale, SalesEntryRepository } from "@modules/sales-entry/sales-entry.repository";
import type { SalesEntry } from "@modules/sales-entry/sales-entry.schema";
import { manilaNow, SalesEntryService } from "@modules/sales-entry/sales-entry.service";
import { BadRequestError, NotFoundError } from "@shared/errors/AppError";
import { beforeEach, describe, expect, it } from "vitest";

// 2026-11-23 10:00 in Manila.
const NOW = new Date("2026-11-23T02:00:00Z");

const makeEntry = (date: string, items: SalesEntry["items"]): SalesEntry => ({
  id: randomUUID(),
  date,
  title: "Market",
  items,
  note: "",
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
});

describe("SalesEntryService", () => {
  let service: SalesEntryService;
  let entries: SalesEntry[];

  beforeEach(() => {
    entries = [
      makeEntry("2026-11-01T09:00", [{ productName: "Ube Pandesal", price: 10, quantity: 12 }]),
      makeEntry("2026-11-20T09:00", [
        { productName: "ube pandesal", price: 12, quantity: 6 },
        { productName: "Ensaymada", price: 45, quantity: 2 },
      ]),
    ];
    const repository: SalesEntryRepository = {
      findAll: async (from, to) =>
        entries.filter((e) => (!from || e.date.slice(0, 10) >= from) && (!to || e.date.slice(0, 10) <= to)),
      findById: async (id) => entries.find((e) => e.id === id) ?? null,
      findProductSales: async () =>
        [...entries]
          .sort((a, b) => b.date.localeCompare(a.date))
          .flatMap((e): ProductSale[] => e.items.map((item) => ({ ...item, date: e.date }))),
      create: async (input) => {
        const entry = { id: randomUUID(), ...input, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() };
        entries.push(entry);
        return entry;
      },
      update: async (id, input) => {
        const entry = { ...(entries.find((e) => e.id === id) as SalesEntry), ...input };
        entries = entries.map((e) => (e.id === id ? entry : e));
        return entry;
      },
      delete: async (id) => {
        entries = entries.filter((e) => e.id !== id);
      },
    };
    service = new SalesEntryService(repository, () => NOW);
  });

  it("converts the clock to Manila wall-clock time", () => {
    expect(manilaNow(NOW)).toBe("2026-11-23T10:00");
    expect(manilaNow(new Date("2026-11-23T17:30:00Z"))).toBe("2026-11-24T01:30");
  });

  it("lists entries in a day range", async () => {
    expect(await service.list("2026-11-15", "2026-11-30")).toEqual([entries[1]]);
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(service.getById(randomUUID())).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.delete(randomUUID())).rejects.toBeInstanceOf(NotFoundError);
  });

  it("creates an entry dated now or earlier", async () => {
    const input = {
      date: "2026-11-23T10:00",
      title: "Walk-in",
      items: [{ productName: "Cookie", price: 5, quantity: 1 }],
      note: "",
    };
    const created = await service.create(input);

    expect(created).toMatchObject(input);
    expect(await service.getById(created.id)).toEqual(created);
  });

  it("rejects a future date, allowing a few minutes of clock skew", async () => {
    const items = [{ productName: "Cookie", price: 5, quantity: 1 }];

    await expect(service.create({ date: "2026-11-23T10:04", title: "Soon", items, note: "" })).resolves.toBeDefined();
    await expect(service.create({ date: "2026-11-23T10:30", title: "Later", items, note: "" })).rejects.toBeInstanceOf(
      BadRequestError,
    );
    await expect(
      service.update((entries[0] as SalesEntry).id, { date: "2026-11-24T08:00", title: "Later", items, note: "" }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("deletes an entry", async () => {
    const id = (entries[0] as SalesEntry).id;
    await service.delete(id);

    await expect(service.getById(id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("suggests each product once, with its latest price, sorted by name", async () => {
    expect(await service.productSuggestions()).toEqual([
      { productName: "Ensaymada", price: 45 },
      { productName: "ube pandesal", price: 12 },
    ]);
  });
});
