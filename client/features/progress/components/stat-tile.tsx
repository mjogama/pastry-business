import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const percent = new Intl.NumberFormat("en-PH", { style: "percent", maximumFractionDigits: 0, signDisplay: "always" });

/** Change against the previous period: icon, signed percent and the period named, never color alone. */
export const Delta = ({ value, against }: { value: number | null; against: string }) => {
  if (value === null)
    return <p className="m-0 text-label text-muted-foreground">Nothing to compare in the {against}</p>;
  const flat = Math.abs(value) < 0.005;
  const Icon = flat ? MinusIcon : value > 0 ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <p className="m-0 flex items-center gap-1 text-label text-muted-foreground">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-semibold",
          flat ? "text-foreground-2" : value > 0 ? "text-status-available" : "text-destructive",
        )}
      >
        <Icon aria-hidden="true" className="size-3.5" />
        {flat ? "0%" : percent.format(value)}
      </span>
      vs {against}
    </p>
  );
};

/** Label, value, then an optional footnote (a delta or a date). `hero` is the page's one big number. */
export const StatTile = ({
  label,
  value,
  footnote,
  hero = false,
  className,
}: {
  label: string;
  value: ReactNode;
  footnote?: ReactNode;
  hero?: boolean;
  className?: string;
}) => (
  <Card className={cn("gap-1.5 rounded-card px-5 py-4 ring-1 ring-border", className)}>
    <p className="m-0 text-body font-medium text-muted-foreground">{label}</p>
    <p
      className={cn(
        "m-0 font-sans leading-none font-bold tracking-display text-foreground",
        hero ? "text-amount-fluid" : "text-sum",
      )}
    >
      {value}
    </p>
    {footnote}
  </Card>
);
