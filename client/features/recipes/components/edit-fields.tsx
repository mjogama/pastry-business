"use client";

import { useLayoutEffect, useRef } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { toNumberInput } from "../lib/format";

const FIELD = "rounded-card border-border bg-surface-inset px-3 text-cell text-foreground-ingredient";
export const INPUT = cn(FIELD, "h-11");
export const AREA = cn(FIELD, "min-h-11 max-h-40 resize-none overflow-y-auto py-2.5 leading-[1.55]");
export const FIELD_LABEL = "text-label-sm font-semibold text-muted-foreground";
export const ADD =
  "h-11 gap-1.5 rounded-card border border-dashed border-input text-body font-medium text-foreground-2";
export const REMOVE = "size-touch shrink-0 rounded-pill text-muted-foreground";

export function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  /** Small second line, e.g. "(optional · shows under the title)". */
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <Label htmlFor={id} className={FIELD_LABEL}>
          {label}
        </Label>
        {required && (
          <span aria-hidden="true" className="text-label-sm leading-none text-honey">
            •
          </span>
        )}
        {hint && <span className="text-label-sm font-normal text-foreground-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** A number box joined to a unit select, e.g. `200 [°C]`. Only digits and one decimal point are accepted. */
export function UnitField<U extends string>({
  id,
  value,
  unit,
  units,
  placeholder,
  onValueChange,
  onUnitChange,
}: {
  id: string;
  value: string;
  unit: U;
  units: readonly U[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: U) => void;
}) {
  return (
    <div className="flex">
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(toNumberInput(e.target.value))}
        className={cn(INPUT, "min-w-0 flex-1 rounded-r-none font-semibold text-honey tabular")}
      />
      <NativeSelect
        aria-label={`${id} unit`}
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as U)}
        wrapperClassName="-ml-px w-20 shrink-0"
        className="rounded-l-none"
      >
        {units.map((u) => (
          <NativeSelectOption key={u} value={u}>
            {u}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

/** Grows with its text up to `max-h-40`, then scrolls inside. No resize handle. */
export function AutoTextarea({
  value,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure whenever the text changes
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [value]);
  return <Textarea ref={ref} value={value} rows={1} className={cn("field-sizing-fixed", className)} {...props} />;
}
