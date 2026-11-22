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

/** Heights (px) of the card's non-row lines in the ingredient list; see book-card.tsx. */
const SECTION_HEADING_H = 22; // text-nano, leading 1.35, pt-1.5 pb-0.5
const MORE_LINE_H = 20; // text-micro, leading 1.35, mt-1

/**
 * Height left for the ingredient list on a card `cw` wide and `ch` tall, and the height of one
 * ingredient row. Mirrors book-card.tsx, whose spacing scales with the card: vertical padding,
 * header (icon tile), one-line name, optional 2-line description, divider, stats row, divider,
 * "Ingredients" header and the flex gaps between them.
 */
function ingredientSpace(cw: number, ch: number, hasDescription: boolean) {
  const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));
  const padY = 2 * clamp(12, cw * 0.047, 24);
  const header = clamp(26, cw * 0.088, 46);
  const gap = clamp(6, cw * 0.024, 12);
  const nameH = Math.min(34, Math.round(cw * 0.085)) * 1.12;
  const descH = hasDescription ? 2 * clamp(11, cw * 0.036, 15) * 1.4 : 0;
  const stats = 12 + 2 + clamp(12, cw * 0.04, 17) * 1.2;
  const ingredientsHeader = 22;
  const gaps = (hasDescription ? 7 : 6) * gap;
  const rowFont = clamp(13, Math.round(cw * 0.042), 17);
  const rowH = rowFont * 1.35 + 11; // leading 1.35, py-1.25 + dashed border
  const avail = ch - (padY + header + nameH + descH + 2 + stats + ingredientsHeader + gaps);
  return { avail, rowH };
}

/**
 * How many ingredients of each section fit on the card, filling whatever height the device
 * gives it. Every section that fits shows its heading; rows are handed out one per section in
 * turn, so one long section can't push the others off the card. A section that can't show all
 * its ingredients gets a "+N ingredients" line. `hiddenSections` counts trailing sections that
 * didn't fit at all, so the card can say how many ingredients they hold.
 */
export function cardIngredientLayout(
  cw: number,
  ch: number,
  sections: { name?: string; ingredients: unknown[] }[],
  hasDescription = false,
) {
  const { avail, rowH } = ingredientSpace(cw, ch, hasDescription);
  const sizes = sections.map((s) => s.ingredients.length);
  const headingH = (i: number) => (sections[i].name ? SECTION_HEADING_H : 0);

  // Which sections fit at all: each needs its heading, plus a "+N" line while nothing shows.
  let used = 0;
  let fitting = 0;
  for (let i = 0; i < sections.length; i++) {
    const cost = headingH(i) + (sizes[i] > 0 ? MORE_LINE_H : 0);
    // Leave room for the closing "+N ingredients" line when later sections get cut.
    const reserve = i < sections.length - 1 ? MORE_LINE_H : 0;
    if (used + cost + reserve > avail && fitting > 0) break;
    used += cost;
    fitting++;
  }
  const hiddenSections = sections.length - fitting;
  if (hiddenSections > 0) used += MORE_LINE_H;

  // Hand out rows round-robin. Showing a section's last row also drops its "+N" line.
  const counts = sizes.slice(0, fitting).map(() => 0);
  let added = true;
  while (added) {
    added = false;
    for (let i = 0; i < fitting; i++) {
      if (counts[i] >= sizes[i]) continue;
      const cost = counts[i] + 1 === sizes[i] ? rowH - MORE_LINE_H : rowH;
      if (used + cost > avail) continue;
      used += cost;
      counts[i]++;
      added = true;
    }
  }
  return { counts, hiddenSections };
}
