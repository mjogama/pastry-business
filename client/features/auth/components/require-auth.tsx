"use client";

import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { getSession } from "../api";

/** Shows its children only for a signed-in owner; others are sent to /sc/auth/login (done inside `getSession`). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then(() => !cancelled && setAllowed(true))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Children always render so the route's own segments are part of the prerender; they stay hidden until the session is confirmed.
  return (
    <>
      {!allowed && (
        <main className="flex flex-1 items-center justify-center text-label text-foreground-faint">
          Checking sign-in…
        </main>
      )}
      <div className={cn(allowed ? "contents" : "hidden")}>{children}</div>
    </>
  );
}
