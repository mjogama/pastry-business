import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { THEME_SCRIPT } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Fallback for `font-sans` where SF Pro Rounded is unavailable (non-Apple devices). */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/** Display serif for the Sales Tracker (`font-display`). On <html> so portalled overlays inherit it. */
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: "variable", axes: ["opsz"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pato's Pâtisserie",
  description: "Developed by Pato",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets data-theme on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, fraunces.variable)}>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant script, no user input */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
