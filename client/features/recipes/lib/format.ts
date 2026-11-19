export const DASH = "—";

const clean = (v?: string) => {
  const t = v?.trim();
  return !t || t.toLowerCase() === "not set" ? undefined : t;
};

/** §6.3 Time: drop parentheses, `hr` → `h`, `min` → `m`. */
export const compactTime = (v?: string) => {
  const t = clean(v);
  if (!t) return DASH;
  return t
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\bhrs?\b/g, "h")
    .replace(/\bmins?\b/g, "m")
    .replace(/(\d)\s+([hm])\b/g, "$1$2")
    .trim();
};

/** §6.3 Quantity: drop a leading "Makes ". */
export const compactQuantity = (v?: string) => clean(v)?.replace(/^makes\s+/i, "") ?? DASH;

/** Ingredient amount for display: `500` → `500 g`, missing → `—`. */
export const formatGrams = (grams?: number) =>
  grams === undefined ? DASH : `${grams.toLocaleString("en-US", { maximumFractionDigits: 2 })} g`;

/** Keeps only digits and one decimal point, so the grams field accepts numbers only. */
export const toGramsInput = (raw: string) => {
  const digits = raw.replace(/[^\d.]/g, "");
  const dot = digits.indexOf(".");
  return dot < 0 ? digits : digits.slice(0, dot + 1) + digits.slice(dot + 1).replace(/\./g, "");
};

export const orDash = (v?: string) => clean(v) ?? DASH;
export const hasValue = (v?: string): v is string => clean(v) !== undefined;

/** Cards list at most this many ingredients; the rest collapse into "+N more ingredients". */
export const MAX_CARD_INGREDIENTS = 9;

/**
 * How many of `total` ingredient rows fit on a card `cw` wide (height `cw × 1.3`), capped at 9.
 * Mirrors book-card.tsx, whose spacing scales with the card: vertical padding, header (icon tile),
 * one-line name, divider 1, label 17, footer 45 and 5 gaps. The "+N more" line (20px) is only
 * reserved when something is cut.
 */
export function cardIngredientSlots(cw: number, total: number) {
  const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));
  const ch = cw * 1.3;
  const padY = 2 * clamp(12, cw * 0.047, 16);
  const header = clamp(26, cw * 0.088, 30);
  const gaps = 5 * clamp(6, cw * 0.024, 8);
  const nameH = Math.round(cw * 0.085) * 1.12;
  const rowFont = clamp(12, Math.round(cw * 0.038), 13);
  const rowH = rowFont * 1.35 + 7; // leading 1.35, py-0.75 + dashed border
  const avail = ch - (padY + header + nameH + 1 + 17 + 45 + gaps);
  const fitAll = Math.floor(avail / rowH);
  if (total <= Math.min(fitAll, MAX_CARD_INGREDIENTS)) return total;
  return Math.max(1, Math.min(MAX_CARD_INGREDIENTS, Math.floor((avail - 20) / rowH)));
}
