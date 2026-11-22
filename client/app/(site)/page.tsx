import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { ArrowIcon, BreadIcon } from "@/features/menu/components/icons";
import { TodaysPicks } from "@/features/menu/components/menu-content";
import { CONTAINER, SiteFooter, SiteTopBar } from "@/features/menu/components/site-chrome";
import { PicksSkeleton } from "@/features/menu/components/skeletons";
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
      <SiteTopBar page="landing" />
      <main className={cn(CONTAINER, "flex flex-1 flex-col gap-landing-section pt-6 pb-page-end")}>
        {/* Hero: text above the image until both fit side by side (420 + 380 + 48px gap). */}
        <section aria-labelledby="hero-title" className="flex flex-wrap items-center gap-12">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5.5">
            <span className="text-body font-semibold tracking-eyebrow text-honey uppercase">Freshly baked</span>
            <h1 id="hero-title" className="font-display text-hero font-bold tracking-hero break-words text-foreground">
              {businessName}
            </h1>
            <p className="max-w-120 text-sum-sm leading-tagline text-foreground-2">{tagline}</p>
            <div className="flex flex-wrap gap-3 pt-1.5">
              <Link href="/menu" className={cn(buttonVariants({ variant: "default", size: "cta" }))}>
                View Menu
                <ArrowIcon />
              </Link>
            </div>
          </div>
          <div className="relative flex aspect-4/3 min-w-0 flex-[1_1_380px] flex-col items-center justify-center gap-3 overflow-hidden rounded-hero border border-border bg-muted text-foreground-faint">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt={businessName}
                fill
                preload
                sizes="(min-width: 1280px) 600px, (min-width: 900px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <>
                <BreadIcon slices strokeWidth={1.4} className="size-14" />
                <span className="text-body font-medium">[Hero photo]</span>
              </>
            )}
          </div>
        </section>

        <Suspense fallback={<PicksSkeleton />}>
          <TodaysPicks />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
