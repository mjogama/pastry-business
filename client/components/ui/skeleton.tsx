import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const skeletonVariants = cva("rounded-md motion-safe:animate-pulse", {
  variants: {
    variant: {
      default: "bg-muted",
      /** Product image area: the placeholder color (docs/MENU_UI_V1.md §5). */
      image: "rounded-none bg-img-placeholder",
      /** One line of text: as tall as the line box of the font size it is given. */
      text: "h-[1lh] bg-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Skeleton({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
  return <div data-slot="skeleton" className={cn(skeletonVariants({ variant }), className)} {...props} />;
}

export { Skeleton, skeletonVariants };
