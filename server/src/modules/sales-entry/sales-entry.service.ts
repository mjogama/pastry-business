import type { SalesEntryRepository } from "./sales-entry.repository";
import { BadRequestError, NotFoundError } from "@shared/errors/AppError";
import type {
  DayKey,
  SalesEntry,
  LocalDateTime,
  ProductSuggestion,
  CreateSalesEntryInput,
  UpdateSalesEntryInput,
} from "./sales-entry.schema";

/** Manila is UTC+8 all year (no daylight saving). */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Allowance for a client clock running slightly ahead of the server's. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

export const manilaNow = (now: Date): LocalDateTime =>
  new Date(now.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 16);

export class SalesEntryService {
  constructor(
    private readonly repository: SalesEntryRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  list(from?: DayKey, to?: DayKey): Promise<SalesEntry[]> {
    return this.repository.findAll(from, to);
  }

  async getById(id: string): Promise<SalesEntry> {
    const entry = await this.repository.findById(id);
    if (!entry) throw new NotFoundError(`Sales entry ${id} not found`);
    return entry;
  }

  /** Each product name (matched case-insensitively) with the price from its most recent entry, sorted by name. */
  async productSuggestions(): Promise<ProductSuggestion[]> {
    const latest = new Map<string, ProductSuggestion>();
    for (const { productName, price } of await this.repository.findProductSales()) {
      const key = productName.toLowerCase();
      if (!latest.has(key)) latest.set(key, { productName, price });
    }
    return [...latest.values()].sort((a, b) => a.productName.localeCompare(b.productName));
  }

  async create(input: CreateSalesEntryInput): Promise<SalesEntry> {
    this.assertNotFuture(input.date);
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateSalesEntryInput): Promise<SalesEntry> {
    await this.getById(id);
    this.assertNotFuture(input.date);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }

  private assertNotFuture(date: LocalDateTime) {
    const latestAllowed = manilaNow(new Date(this.clock().getTime() + CLOCK_SKEW_MS));
    if (date > latestAllowed) throw new BadRequestError("The date can’t be in the future.");
  }
}
