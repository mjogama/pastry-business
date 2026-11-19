import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        /** Recipe Book carousel card and page dot (docs/RECIPIES_UI_V1.md): bare, styled by the caller. */
        bare: "h-auto rounded-none p-0 text-foreground active:not-aria-[haspopup]:translate-y-0",
        /* Business Menu (docs/MENU_UI_V1.md) */
        /** Top bar Menu / Home pill: `--surface-1` (§6). */
        nav: "bg-muted text-foreground hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]",
        /** Product card (§7.3): `--surface-product`, `--line` border; hover lifts 2px. */
        product:
          "border-border bg-surface-product text-foreground duration-150 hover:-translate-y-0.5 hover:border-line-dashed motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        /** Footer tap-to-call pill (§7.5): `--line-strong` border. */
        "call-outline": "border-input bg-transparent text-foreground hover:bg-muted",
        /** × over the sheet image (§7.4). */
        overlay: "bg-background/85 text-foreground hover:bg-background",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        /* Business Menu (docs/MENU_UI_V1.md) */
        /** 44px pill, 18px sides, 15/500 (top bar link). */
        pill: "h-touch rounded-pill px-4.5 text-cell font-medium",
        /** View Menu: 52px pill, 17/700 (§7.1). Full width on phones (§8). */
        cta: "h-auto min-h-cta w-full gap-2.5 rounded-pill px-6.5 text-card-title font-bold sm:w-auto [&_svg:not([class*='size-'])]:size-4.5",
        /** Sheet Call button: full width, 50px, radius 14 (§7.4). */
        call: "h-auto min-h-call w-full gap-2.5 rounded-card px-4 text-body-lg font-bold [&_svg:not([class*='size-'])]:size-4.5",
        /** Footer call pill: ≥ 48px (§7.5). */
        "footer-call":
          "h-auto min-h-footer-call gap-2.5 rounded-pill px-5 text-left [&_svg:not([class*='size-'])]:size-4.5",
        /** Product card body: a full-size column, wrapping text (§7.3). */
        card: "h-full w-full flex-col items-stretch justify-start gap-0 overflow-hidden rounded-product p-0 text-left text-base font-normal whitespace-normal",
        /** 44×44 icon button. */
        "icon-touch": "size-touch rounded-pill [&_svg:not([class*='size-'])]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
