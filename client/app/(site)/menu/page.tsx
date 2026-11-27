import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuContent } from "@/features/menu/components/menu-content";
import { CONTAINER, SiteFooter, SiteTopBar } from "@/features/menu/components/site-chrome";
import { FooterSkeleton, MenuSkeleton, TopBarSkeleton } from "@/features/menu/components/skeletons";
import { getBusinessSettings } from "@/features/menu/data/menu-data";
import { PreOrderNotice } from "@/features/pre-orders/components/pre-order-notice";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName } = await getBusinessSettings();
  return { title: `Menu · ${businessName}` };
}

/** Menu page (§7.2): top bar, title, sticky chips, category sections, footer. */
export default function MenuPage({ searchParams }: PageProps<"/menu">) {
  return (
    <>
      <Suspense fallback={<TopBarSkeleton page="menu" />}>
        <SiteTopBar page="menu" />
      </Suspense>
      <main className={cn(CONTAINER, "flex flex-1 flex-col gap-7 pt-7 pb-page-end")}>
        {/* Title on the left, the pre-order card beside it; stacked on narrow screens. */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-menu-title font-bold tracking-menu-title text-foreground">Menu</h1>
            <p className="text-body-lg text-muted-foreground">Tap the item to place an order.</p>
          </div>
          <Suspense fallback={null}>
            <PreOrderNotice />
          </Suspense>
        </div>
        <Suspense fallback={<MenuSkeleton />}>
          <MenuContent searchParams={searchParams} />
        </Suspense>
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <SiteFooter />
      </Suspense>
    </>
  );
}
