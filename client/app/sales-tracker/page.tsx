import type { Metadata, Viewport } from "next";

import { SalesTracker } from "@/features/sales-tracker/components/sales-tracker";

export const metadata: Metadata = {
  title: "Sales Tracker",
  description: "Daily revenue calendar",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#FFF8EC",
};

export default function SalesTrackerPage() {
  return <SalesTracker />;
}
