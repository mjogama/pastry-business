import type { IngredientUnit, Temperature, TemperatureUnit } from "@common/modules/recipes";

export const DASH = "—";

const formatNumber = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Bake temperature: `{ 180, "°C" }` → `180 °C`. */
/** Quantity: `12` → `12`. */
export const formatQuantity = (n?: number) => (n === undefined ? DASH : formatNumber(n));

export const formatTemperature = (t?: Temperature) => (t ? `${formatNumber(t.value)} ${t.unit}` : DASH);

/** Est. Time as typed; empty → `—`. */
export const formatTime = (v?: string) => v?.trim() || DASH;

/** Cards: drop parentheses, `hr` → `h`, `min` → `m` (`2 hr 30 min (rest)` → `2h 30m`). */
export const compactTime = (v?: string) => {
  const t = v?.trim();
  if (!t) return DASH;
  return t
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\bhrs?\b/g, "h")
    .replace(/\bmins?\b/g, "m")
    .replace(/(\d)\s+([hm])\b/g, "$1$2")
    .trim();
};

export const TEMPERATURE_UNITS = ["°C", "°F"] as const satisfies readonly TemperatureUnit[];
export const INGREDIENT_UNITS = ["mg", "g", "tsp", "tbsp", "c", "pc"] as const satisfies readonly IngredientUnit[];

/** Ingredient quantity for display: `500, "g"` → `500 g`, `2, "tsp"` → `2 tsp`. */
export const formatAmount = (quantity: number, unit: IngredientUnit) => `${formatNumber(quantity)} ${unit}`;

/** Keeps only digits, so whole-number fields accept integers only. */
export const toIntegerInput = (raw: string) => raw.replace(/\D/g, "");

/** Keeps only digits and one decimal point, so number fields accept numbers only. */
export const toNumberInput = (raw: string) => {
  const digits = raw.replace(/[^\d.]/g, "");
  const dot = digits.indexOf(".");
  return dot < 0 ? digits : digits.slice(0, dot + 1) + digits.slice(dot + 1).replace(/\./g, "");
};

/** Cards list at most this many ingredients; the rest collapse into "+N more ingredients". */
export const MAX_CARD_INGREDIENTS = 12;

/**
 * How many of `total` ingredient entries (rows and section headings) fit on a card `cw` wide
 * and `ch` tall, capped at MAX_CARD_INGREDIENTS. Mirrors book-card.tsx, whose spacing scales with the card:
 * vertical padding, header (icon tile), one-line name, optional 2-line description, divider,
 * stats row, divider, "Ingredients" header and the flex gaps between them. The "+N more" line
 * (20px) is only reserved when something is cut.
 */
export function cardIngredientSlots(cw: number, ch: number, total: number, hasDescription = false) {
  const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));
  const padY = 2 * clamp(12, cw * 0.047, 24);
  const header = clamp(26, cw * 0.088, 46);
  const gap = clamp(6, cw * 0.024, 12);
  const nameH = Math.round(cw * 0.085) * 1.12;
  const descH = hasDescription ? 2 * clamp(11, cw * 0.036, 19) * 1.4 : 0;
  const stats = 12 + 2 + clamp(12, cw * 0.04, 21) * 1.2;
  const ingredientsHeader = 22;
  const gaps = (hasDescription ? 7 : 6) * gap;
  const rowFont = clamp(13, Math.round(cw * 0.042), 22);
  const rowH = rowFont * 1.35 + 11; // leading 1.35, py-1.25 + dashed border
  const avail = ch - (padY + header + nameH + descH + 2 + stats + ingredientsHeader + gaps);
  const fitAll = Math.floor(avail / rowH);
  if (total <= Math.min(fitAll, MAX_CARD_INGREDIENTS)) return total;
  return Math.max(1, Math.min(MAX_CARD_INGREDIENTS, Math.floor((avail - 20) / rowH)));
}
