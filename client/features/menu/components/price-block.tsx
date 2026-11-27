import { Badge } from "@/components/ui/badge";
import { Money } from "@/features/sales-tracker/components/ui/primitives";
import { cn } from "@/lib/utils";

import type { ProductView } from "../types";

/**
 * `[₱85 struck] ₱69 [Save ₱16]` on sale, otherwise `₱85` (§6). Each piece is unbreakable, so a
 * price never splits; on a narrow card the Save chip wraps to the next line as a whole.
 * `pick` is the landing page's compact card: no Save chip, 18px final price (§7.1).
 * `menu` is the menu card: the struck price, then the large final price on the right; the savings sit
 * on the photo. The product sheet uses the same order.
 */
export const PriceBlock = ({
  product,
  variant = "card",
  className,
}: {
  product: Pick<ProductView, "price" | "finalPrice" | "savings" | "isOnSale">;
  variant?: "card" | "pick" | "menu";
  className?: string;
}) => (
  <span className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
    {product.isOnSale && (
      <s
        className={cn("whitespace-nowrap text-foreground-faint", variant === "menu" ? "text-card-title" : "text-body")}
      >
        <span className="sr-only">Was </span>
        <Money amount={product.price} />
      </s>
    )}
    <Money
      amount={product.finalPrice}
      className={cn(
        "font-bold whitespace-nowrap",
        variant === "menu" ? "text-[26px] text-foreground" : "text-honey",
        variant === "card" && "text-card-price",
        variant === "pick" && "text-sum-sm",
      )}
    />
    {product.isOnSale && variant === "card" && (
      <Badge variant="save" className="self-center">
        Save <Money amount={product.savings} />
      </Badge>
    )}
  </span>
);
