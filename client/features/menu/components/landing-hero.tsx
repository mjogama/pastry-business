import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { BusinessSettings } from "../types";
import { ArrowIcon, BreadIcon } from "./icons";

/** Hero (§7.1): text above the image until both fit side by side (420 + 380 + 48px gap). Shared by `/` and the CMS. */
export const LandingHero = ({
  businessName,
  tagline,
  heroImageUrl,
  menuHref = "/menu",
}: Pick<BusinessSettings, "businessName" | "tagline" | "heroImageUrl"> & { menuHref?: string }) => (
  <section aria-labelledby="hero-title" className="flex flex-wrap items-center gap-12">
    <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5.5">
      <span className="text-body font-semibold tracking-eyebrow text-honey uppercase">Freshly baked</span>
      <h1 id="hero-title" className="font-display text-hero font-bold tracking-hero break-words text-foreground">
        {businessName}
      </h1>
      <p className="max-w-120 text-sum-sm leading-tagline text-foreground-2">{tagline}</p>
      <div className="flex flex-wrap gap-3 pt-1.5">
        <Link href={menuHref} className={cn(buttonVariants({ variant: "default", size: "cta" }))}>
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
);
