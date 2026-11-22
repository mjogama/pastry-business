import { Badge } from "@/components/ui/badge";
import { Money } from "@/features/sales-tracker/components/ui/primitives";
import { cn } from "@/lib/utils";

import type { ProductView } from "../types";

/**
 * `[₱85 struck] ₱69 [Save ₱16]` on sale, otherwise `₱85` (§6). Each piece is unbreakable, so a
 * price never splits; on a narrow card the Save chip wraps to the next line as a whole.
 * `pick` is the landing page's compact card: no Save chip, 18px final price (§7.1).
 */
export const PriceBlock = ({
  product,
  variant = "card",
  className,
}: {
  product: Pick<ProductView, "price" | "finalPrice" | "savings" | "isOnSale">;
  variant?: "card" | "pick";
  className?: string;
}) => (
  <span className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
    {product.isOnSale && (
      <s className="text-body whitespace-nowrap text-foreground-faint">
        <span className="sr-only">Was </span>
        <Money amount={product.price} />
      </s>
    )}
    <Money
      amount={product.finalPrice}
      className={cn("font-bold whitespace-nowrap text-honey", variant === "card" ? "text-card-price" : "text-sum-sm")}
    />
    {product.isOnSale && variant === "card" && (
      <Badge variant="save" className="self-center">
        Save <Money amount={product.savings} />
      </Badge>
    )}
  </span>
);
