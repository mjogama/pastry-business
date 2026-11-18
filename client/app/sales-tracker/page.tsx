import type { Metadata, Viewport } from "next";

import { SalesTracker } from "@/features/sales-tracker/components/sales-tracker";

export const metadata: Metadata = {
  title: "Sales Tracker",
  description: "Daily revenue calendar",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#1C1511",
};

export default function SalesTrackerPage() {
  return <SalesTracker />;
}
