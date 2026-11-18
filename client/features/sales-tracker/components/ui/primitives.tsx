import type { ComponentProps, HTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { formatPeso, formatPesoCompact } from "../../lib/money";

/**
 * Popover fields (§6) on the shadcn `Input` / `Textarea`: borderless and transparent, ≥ 44px,
 * 16px text at every size (no iOS zoom), inset gold ring on focus (from the theme).
 * `boxed` sits on `--surface-inset`.
 */
const fieldClass = (boxed: boolean, className?: string) =>
  cn(
    "h-auto min-h-touch rounded-control border-0 px-3 py-2.5 text-body-lg text-foreground placeholder:text-foreground-faint md:text-body-lg",
    boxed ? "bg-surface-inset" : "bg-transparent",
    className,
  );

export const PopoverField = ({
  boxed = false,
  className,
  ...props
}: ComponentProps<typeof Input> & { boxed?: boolean }) => <Input className={fieldClass(boxed, className)} {...props} />;

export const PopoverTextArea = ({
  boxed = false,
  className,
  ...props
}: ComponentProps<typeof Textarea> & { boxed?: boolean }) => (
  <Textarea className={fieldClass(boxed, cn("field-sizing-fixed", className))} {...props} />
);

/** PHP per §3 with tabular figures. `compact` is the phone cell form (§8.2). */
export const Money = ({
  amount,
  compact = false,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { amount: number; compact?: boolean }) => (
  <span className={cn("tabular", className)} {...props}>
    {compact ? formatPesoCompact(amount) : formatPeso(amount)}
  </span>
);

/**
 * Backdrop props for shadcn Sheet / Dialog / Drawer: the spec's scrim color, rendered as a real
 * button (§6, §9). Pressing it closes the overlay; keyboard users press Escape.
 */
export const scrimProps = (tone: "panel" | "centered", label: string) => ({
  className: cn("supports-backdrop-filter:backdrop-blur-none", tone === "panel" ? "bg-scrim" : "bg-scrim-strong"),
  render: (
    <Button
      variant={null}
      size={null}
      tabIndex={-1}
      aria-label={label}
      className="cursor-default rounded-none border-0 p-0 active:not-aria-[haspopup]:translate-y-0"
    />
  ),
});
