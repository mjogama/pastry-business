import { formatPeso } from "@/features/sales-tracker/lib/money";

import type { ProductTotal } from "../lib/progress";

/**
 * Products ranked by revenue: name and quantity on top, a 10px bar (4px rounded end, square at the
 * start) under it in `--chart-1`, the amount at the right. Every value is printed, so no tooltip is needed.
 */
export function TopProducts({ products }: { products: ProductTotal[] }) {
  const max = Math.max(0, ...products.map((product) => product.revenue));
  if (!products.length) return <p className="m-0 text-body text-muted-foreground">No products sold in this range.</p>;
  return (
    <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
      {products.map((product) => (
        <li key={product.productName} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-body">
            <span className="min-w-0 truncate font-medium text-foreground">
              {product.productName}
              <span className="ml-2 font-normal text-muted-foreground tabular">× {product.quantity}</span>
            </span>
            <span className="shrink-0 font-semibold text-foreground tabular">{formatPeso(product.revenue)}</span>
          </div>
          <div aria-hidden="true" className="h-2.5 w-full">
            <div
              className="h-full rounded-r-tag bg-chart-1"
              style={{ width: `${max > 0 ? Math.max(1, (product.revenue / max) * 100) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
