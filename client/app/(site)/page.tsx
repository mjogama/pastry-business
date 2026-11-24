import type { Metadata } from "next";
import { Suspense } from "react";

import { LandingHero } from "@/features/menu/components/landing-hero";
import { TodaysPicks } from "@/features/menu/components/menu-content";
import { CONTAINER, SiteFooter, SiteTopBar } from "@/features/menu/components/site-chrome";
import { FooterSkeleton, PicksSkeleton, TopBarSkeleton } from "@/features/menu/components/skeletons";
import { getBusinessSettings } from "@/features/menu/data/menu-data";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName, tagline } = await getBusinessSettings();
  return { title: businessName, description: tagline };
}

/** Landing page (§7.1): top bar, hero, Today's picks, footer. */
export default async function LandingPage() {
  const { businessName, tagline, heroImageUrl } = await getBusinessSettings();
  return (
    <>
      <Suspense fallback={<TopBarSkeleton page="landing" />}>
        <SiteTopBar page="landing" />
      </Suspense>
      <main className={cn(CONTAINER, "flex flex-1 flex-col gap-landing-section pt-6 pb-page-end")}>
        <LandingHero businessName={businessName} tagline={tagline} heroImageUrl={heroImageUrl} />

        <Suspense fallback={<PicksSkeleton />}>
          <TodaysPicks />
        </Suspense>
      </main>
      <Suspense fallback={<FooterSkeleton />}>
        <SiteFooter />
      </Suspense>
    </>
  );
}
