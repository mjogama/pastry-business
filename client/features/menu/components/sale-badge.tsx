import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** `SALE` pill at the image's top-left, 12px inset (§6). The sheet uses the larger size. */
export const SaleBadge = ({ size = "default", className }: { size?: "default" | "lg"; className?: string }) => (
  <Badge variant="sale" size={size} className={cn("absolute top-3 left-3", className)}>
    SALE
  </Badge>
);
