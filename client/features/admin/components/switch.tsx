"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** An on/off switch with its text label beside it (state is never shown by color alone). */
export const Switch = ({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) => (
  <Button
    type="button"
    variant="bare"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "min-h-touch justify-start gap-2.5 rounded-pill text-label font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
      className,
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        "relative h-5.5 w-10 shrink-0 rounded-pill border border-input transition-colors motion-reduce:transition-none",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-4 rounded-pill bg-foreground transition-transform motion-reduce:transition-none",
          checked && "translate-x-4.5 bg-primary-foreground",
        )}
      />
    </span>
    {label}
  </Button>
);
