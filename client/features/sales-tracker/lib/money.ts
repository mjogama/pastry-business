const pesoFormat = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** `₱1,234`, `₱1,234.5`, `₱95`: en-PH grouping, up to 2 decimals, no trailing `.00` (§3). */
export const formatPeso = (amount: number): string => `₱${pesoFormat.format(amount)}`;

const trimZero = (value: number) => String(value).replace(/\.0$/, "");

/** Phone cells (§8.2): `₱950`, `₱1.9k`, `₱12k`, `₱1.2M`. Rounds down so a cell never overstates a day. */
export const formatPesoCompact = (amount: number): string => {
  if (amount < 1_000) return `₱${Math.floor(amount)}`;
  if (amount < 10_000) return `₱${trimZero(Math.floor(amount / 100) / 10)}k`;
  if (amount < 1_000_000) return `₱${Math.floor(amount / 1_000)}k`;
  if (amount < 10_000_000) return `₱${trimZero(Math.floor(amount / 100_000) / 10)}M`;
  return `₱${Math.floor(amount / 1_000_000)}M`;
};

/** Multiplies money without float drift (₱0.1 × 3 = ₱0.3). */
export const lineRevenue = (price: number, quantity: number): number => Math.round(price * 100 * quantity) / 100;

export const sumMoney = (values: number[]): number =>
  Math.round(values.reduce((sum, value) => sum + value * 100, 0)) / 100;
