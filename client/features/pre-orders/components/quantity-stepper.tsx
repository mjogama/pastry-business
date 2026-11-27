"use client";

import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** − count + with 44px targets. `min` 0 lets the minus remove the line. */
export const QuantityStepper = ({
  value,
  onChange,
  min = 1,
  max,
  label,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  /** What is being counted, for screen readers: "Ube Pandesal". */
  label: string;
  className?: string;
}) => (
  <fieldset
    aria-label={`Quantity of ${label}`}
    className={cn("m-0 inline-flex min-w-0 items-center rounded-pill border border-input bg-surface-inset", className)}
  >
    <Button
      type="button"
      variant="ghost"
      size="icon-touch"
      aria-label={value <= 1 && min === 0 ? `Remove ${label}` : `One less ${label}`}
      disabled={value <= min}
      onClick={() => onChange(value - 1)}
    >
      <MinusIcon aria-hidden="true" />
    </Button>
    <span aria-live="polite" className="tabular min-w-8 text-center text-body-lg font-bold text-foreground">
      {value}
    </span>
    <Button
      type="button"
      variant="ghost"
      size="icon-touch"
      aria-label={`One more ${label}`}
      disabled={value >= max}
      onClick={() => onChange(value + 1)}
    >
      <PlusIcon aria-hidden="true" />
    </Button>
  </fieldset>
);
