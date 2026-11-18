import { cn } from "@/lib/utils";

/** An 8px dot plus the label; never color alone (§6, §10). 13px on cards, 14px in the sheet. */
export const AvailabilityTag = ({
  isAvailable,
  size = "card",
  className,
}: {
  isAvailable: boolean;
  size?: "card" | "sheet";
  className?: string;
}) => (
  <span
    className={cn(
      "flex items-center gap-1.75 font-medium",
      size === "card" ? "text-label" : "text-body",
      isAvailable ? "text-status-available" : "text-status-out",
      className,
    )}
  >
    <span aria-hidden="true" className="size-2 shrink-0 rounded-pill bg-current" />
    {isAvailable ? "Available" : "Out of stock"}
  </span>
);
