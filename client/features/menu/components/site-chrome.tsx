import { io } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getBusinessSettings } from "../data/menu-data";
import { formatLocalPhone, telHref } from "../lib/phone";
import { manilaToday } from "../lib/pricing";
import { PhoneIcon } from "./icons";

/** The 1280px content column with 24px sides plus safe areas (§5). */
export const CONTAINER = "mx-auto w-full max-w-menu menu-gutter";

/**
 * Business name (Fraunces 22/700) linking to `/`, and a pill to the other page: **Menu** on the
 * landing page, **Home** on the menu page (§6).
 */
export const SiteTopBar = async ({ page }: { page: "landing" | "menu" }) => {
  const { businessName } = await getBusinessSettings();
  const other = page === "landing" ? { href: "/menu", label: "Menu" } : { href: "/", label: "Home" };
  return (
    <header
      className={cn(
        CONTAINER,
        "flex items-center justify-between gap-4 pt-[calc(var(--spacing-page-top)+env(safe-area-inset-top))]",
        page === "landing" ? "pb-5" : "pb-0",
      )}
    >
      <Link
        href="/"
        className="flex min-h-touch min-w-0 items-center font-display text-entry-title font-bold text-foreground"
      >
        <span className="truncate">{businessName}</span>
      </Link>
      <Link href={other.href} className={cn(buttonVariants({ variant: "nav", size: "pill" }))}>
        {other.label}
      </Link>
    </header>
  );
};

/** Copyright year in Manila. Rendered per request so it never goes stale in the static shell. */
const CurrentYear = async () => {
  await io();
  return <>{manilaToday().slice(0, 4)}</>;
};

/** Footer (§7.5): name and © on the left, tap-to-call pill on the right; stacks on phones. */
export const SiteFooter = async () => {
  const { businessName, contactNumber } = await getBusinessSettings();
  return (
    <footer className="border-t border-border bg-footer">
      <div
        className={cn(
          CONTAINER,
          "flex flex-wrap items-center justify-between gap-5 pt-8 pb-[calc(var(--spacing-page-bottom)+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-display text-sum font-bold text-foreground">{businessName}</span>
          <span className="text-label text-muted-foreground">
            ©{" "}
            <Suspense fallback={<span className="tabular inline-block w-[4ch]" />}>
              <span className="tabular">
                <CurrentYear />
              </span>
            </Suspense>{" "}
            {businessName}
          </span>
        </div>
        <a
          href={telHref(contactNumber)}
          className={cn(buttonVariants({ variant: "call-outline", size: "footer-call" }))}
        >
          <PhoneIcon className="text-primary" />
          <span className="flex flex-col leading-tight">
            <span className="text-label-sm font-normal text-muted-foreground">Call us</span>
            <span className="tabular text-body-lg font-semibold">{formatLocalPhone(contactNumber)}</span>
          </span>
        </a>
      </div>
    </footer>
  );
};
