import { CalendarClockIcon } from "lucide-react";

import { getBusinessSettings } from "@/features/menu/data/menu-data";

import { weekdaysText } from "../lib/days";

/**
 * In the /menu header, beside the title (under it on narrow screens), while pre-orders are open: the owner's hand-over days and
 * time in a card. `#pre-order` is the landing hero's "Pre-order for school" target.
 */
export const PreOrderNotice = async () => {
  const settings = await getBusinessSettings();
  if (!settings.preOrdersOpen) return null;
  const days = weekdaysText(settings.preOrderDays, true);
  const time = settings.preOrderHandoffTime;

  return (
    <section
      id="pre-order"
      aria-labelledby="pre-order-title"
      className="flex scroll-mt-24 items-center md:shrink-0 gap-3.5 rounded-card border border-dashed border-input bg-surface-note px-5 py-4"
    >
      <CalendarClockIcon aria-hidden="true" className="size-6 shrink-0 text-honey" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 id="pre-order-title" className="text-body-lg font-bold text-foreground">
          Pre-order for school
        </h2>
        <p className="text-body text-foreground-2">
          Hand-over on <strong className="font-semibold text-foreground">{days} only</strong>
          {time && (
            <>
              , <strong className="font-semibold text-foreground">{time}</strong>
            </>
          )}
        </p>
      </div>
    </section>
  );
};
