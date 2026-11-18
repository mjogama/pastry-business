import { io } from "next/cache";
import Link from "next/link";

import { getMenuData } from "../data/menu-data";
import { buildSections, itemCount, todaysPicks } from "../lib/menu";
import { manilaToday } from "../lib/pricing";
import { CategoryChips } from "./category-chips";
import { ALL, MenuProvider, MenuSectionFilter, SECTIONS_ID } from "./menu-provider";
import { PickCard, ProductCard } from "./product-card";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * /menu below the title: chips and category sections (§7.2). Rendered per request because sale
 * prices depend on today's Manila date.
 */
export const MenuContent = async ({ searchParams }: { searchParams: PageProps<"/menu">["searchParams"] }) => {
  await io();
  const [{ settings, categories, products }, query] = await Promise.all([getMenuData(), searchParams]);
  const sections = buildSections(categories, products, manilaToday());
  const requested = first(query.c);
  const initialCategory = sections.some((section) => section.category.id === requested) ? (requested as string) : ALL;

  return (
    <MenuProvider
      products={sections.flatMap((section) => section.products)}
      settings={{ contactNumber: settings.contactNumber }}
      initialCategory={initialCategory}
      initialProductId={first(query.p)}
    >
      <CategoryChips categories={sections.map(({ category }) => ({ id: category.id, name: category.name }))} />
      <div id={SECTIONS_ID} className="flex scroll-mt-24 flex-col gap-7">
        {sections.map(({ category, products: items }) => (
          <MenuSectionFilter key={category.id} categoryId={category.id}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`section-${category.id}`} className="font-display text-section font-bold text-foreground">
                {category.name}
              </h2>
              <span className="tabular text-body text-foreground-faint">{itemCount(items.length)}</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(var(--spacing-card-min),100%),1fr))] gap-5">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </MenuSectionFilter>
        ))}
      </div>
    </MenuProvider>
  );
};

/** Landing "Today's picks" (§7.1). Hidden when nothing qualifies (§4). */
export const TodaysPicks = async () => {
  await io();
  const { categories, products } = await getMenuData();
  const picks = todaysPicks(categories, products, manilaToday());
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="picks-title" className="flex flex-col gap-5.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="picks-title" className="font-display text-picks-title font-bold text-foreground">
          Today’s picks
        </h2>
        <Link href="/menu" className="flex min-h-touch items-center text-cell font-semibold text-primary">
          See full menu →
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(var(--spacing-pick-min),100%),1fr))] gap-5">
        {picks.map((product) => (
          <PickCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
