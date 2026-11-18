import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Sales Tracker buttons (§6), all built on the shadcn `Button`. The Dark Roast theme supplies
 * the colors (`default` = gold, `secondary` = surface button); these wrappers only fix the
 * spec's sizes so every screen uses the same buttons.
 */
type ButtonProps = ComponentProps<typeof Button>;

/** Buttons drawn shorter than 44px get an invisible 44px hit area (§5.3, §9). */
const TOUCH = "touch-target";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  /** 36px pill: the side panel's Edit / Delete (§7.6). */
  sm: cn("h-9 min-w-16 rounded-pill px-3.5 text-label", TOUCH),
  /** 40px, radius 10: the popover action row (§7.7). */
  md: cn("h-10 rounded-control px-4 text-body", TOUCH),
  /** 48px, radius 10: "+ Add entry for this day" (§7.6). */
  lg: "h-12 w-full rounded-control px-4 text-cell",
};

/** 44×44, pill, `--surface-1`, 18px icon. `aria-label` is required (§6). */
export const IconButton = ({ className, ...props }: ButtonProps & { "aria-label": string }) => (
  <Button
    variant="secondary"
    size="icon"
    className={cn("size-touch rounded-pill bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4.5", className)}
    {...props}
  />
);

/** 44px tall, 18px sides, `--surface-1`, 15/500 (§6). */
export const PillButton = ({ className, ...props }: ButtonProps) => (
  <Button
    variant="secondary"
    className={cn("h-touch rounded-pill bg-muted px-4.5 text-cell font-medium text-foreground", className)}
    {...props}
  />
);

/** Gold background, dark text, 700 (§6). */
export const PrimaryButton = ({ size = "md", className, ...props }: Omit<ButtonProps, "size"> & { size?: Size }) => (
  <Button variant="default" className={cn(SIZES[size], "font-bold", className)} {...props} />
);

/** `--surface-button` background; `outline` is the panel's Edit (§6, §7.6). */
export const SecondaryButton = ({
  size = "md",
  outline = false,
  className,
  ...props
}: Omit<ButtonProps, "size" | "variant"> & { size?: Size; outline?: boolean }) => (
  <Button
    variant={outline ? "outline" : "secondary"}
    className={cn(
      SIZES[size],
      outline ? "border-input bg-transparent font-normal" : "font-medium",
      "text-foreground",
      className,
    )}
    {...props}
  />
);

/** `--surface-button` background with danger text; `outline` is the panel's Delete (§6, §7.6). */
export const DangerButton = ({
  size = "md",
  outline = false,
  className,
  ...props
}: Omit<ButtonProps, "size" | "variant"> & { size?: Size; outline?: boolean }) => (
  <Button
    variant={outline ? "outline" : "secondary"}
    className={cn(
      SIZES[size],
      outline ? "border-danger-line bg-transparent font-normal" : "font-semibold",
      "text-destructive",
      className,
    )}
    {...props}
  />
);

/** Gold text button: "+ Add product" (§7.7). */
export const TextButton = ({ className, ...props }: ButtonProps) => (
  <Button
    variant="ghost"
    className={cn("h-touch px-1 text-body font-semibold text-primary hover:text-primary", className)}
    {...props}
  />
);
