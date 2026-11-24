import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";

export const viewport: Viewport = { themeColor: "#FFF8EC" };

export const metadata: Metadata = { title: "Sign in · Pato's Pâtisserie", robots: { index: false } };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
