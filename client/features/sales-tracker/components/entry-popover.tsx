"use client";

import { XIcon } from "lucide-react";
import { type FormEvent, type ReactNode, type RefObject, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerSwipeHandle, DrawerTitle } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Popover, PopoverArrow, PopoverContent, PopoverTitle } from "@/components/ui/popover";
import { newId } from "@/lib/id";
import { cn } from "@/lib/utils";
import { readNow } from "../hooks/use-environment";
import { formatEntryDateTime } from "../lib/dates";
import { lineRevenue, sumMoney } from "../lib/money";
import { firstEntryError, isEntryValidationError, TITLE_MAX_LENGTH } from "../lib/validation";
import { createEntry, deleteEntry, updateEntry } from "../store/sales-store";
import type { CreateSalesEntryInput, LocalDateTime, ProductSuggestion, SalesEntry } from "../types";
import { DangerButton, PrimaryButton, SecondaryButton, TextButton } from "./ui/buttons";
import { Money, PopoverField, PopoverTextArea, scrimProps } from "./ui/primitives";

/** `anchor` is the clicked day cell; the popover sits beside it when there is room. */
export type EntryRequest =
  | { mode: "create"; date: LocalDateTime; anchor?: HTMLElement }
  | { mode: "edit"; entry: SalesEntry; anchor?: undefined };

/** anchored: beside the cell (≥ 720px) · centered: Dialog · sheet: phone Drawer (§7.7, §8.4) */
export type EntryPlacement = "anchored" | "centered" | "sheet";

interface DraftRow {
  key: string;
  name: string;
  price: string;
  qty: string;
  /** True while the price is the value auto-filled from a remembered product (§3). */
  autoPrice: boolean;
}

interface Draft {
  date: LocalDateTime;
  title: string;
  note: string;
  rows: DraftRow[];
}

const newRow = (): DraftRow => ({ key: newId(), name: "", price: "", qty: "1", autoPrice: false });

const initialDraft = (request: EntryRequest): Draft =>
  request.mode === "create"
    ? { date: request.date, title: "", note: "", rows: [newRow()] }
    : {
        date: request.entry.date,
        title: request.entry.title,
        note: request.entry.note,
        rows: request.entry.items.map((item) => ({
          key: newId(),
          name: item.productName,
          price: String(item.price),
          qty: String(item.quantity),
          autoPrice: false,
        })),
      };

const toNumber = (value: string) => (value.trim() === "" ? Number.NaN : Number(value));

const toInput = (draft: Draft): CreateSalesEntryInput => ({
  date: draft.date,
  title: draft.title,
  note: draft.note,
  items: draft.rows.map((row) => ({ productName: row.name, price: toNumber(row.price), quantity: toNumber(row.qty) })),
});

const rowRevenue = (row: DraftRow) => {
  const price = Number.parseFloat(row.price);
  const qty = Number.parseInt(row.qty, 10);
  return Number.isFinite(price) && Number.isFinite(qty) ? lineRevenue(price, qty) : 0;
};

/**
 * Product rows. ≥ 560px: Product | Price | Qty | Revenue | ×. The prototype's 2 : 1 : 0.8 : 1 left
 * Price ~67px and Qty ~54px, mostly taken by the native number spinner, so the number columns
 * get more of the popover's fixed 440px (name ~113px, price ~81px, qty ~65px, revenue ~65px).
 */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px] gap-1.5 rows:grid-cols-[minmax(0,1.75fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_36px]";

interface EntryFormProps {
  request: EntryRequest;
  suggestions: ProductSuggestion[];
  now: LocalDateTime;
  isSheet: boolean;
  titleRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSaved: (entry: SalesEntry) => void;
}

/** The form itself (§7.7 contents, top to bottom), shared by all three containers. */
const EntryForm = ({ request, suggestions, now, isSheet, titleRef, onClose, onSaved }: EntryFormProps) => {
  const fieldId = useId();
  const [draft, setDraft] = useState(() => initialDraft(request));
  const [error, setError] = useState<string | null>(null);
  const isEdit = request.mode === "edit";

  const remembered = useMemo(
    () => new Map(suggestions.map((suggestion) => [suggestion.productName.toLowerCase(), suggestion])),
    [suggestions],
  );

  const setRow = (key: string, patch: (row: DraftRow) => Partial<DraftRow>) =>
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.key === key ? { ...row, ...patch(row) } : row)),
    }));

  const onName = (key: string, name: string) =>
    setRow(key, (row) => {
      const hit = remembered.get(name.trim().toLowerCase());
      // Fill the remembered price only into an empty price or one we filled ourselves.
      if (hit && (row.price === "" || row.autoPrice)) return { name, price: String(hit.price), autoPrice: true };
      return { name };
    });

  const save = (event: FormEvent) => {
    event.preventDefault();
    const input = toInput(draft);
    const currentNow = readNow();
    const firstError = firstEntryError(input, currentNow);
    if (firstError) {
      setError(firstError);
      return;
    }
    try {
      const saved =
        request.mode === "edit" ? updateEntry(request.entry.id, input, currentNow) : createEntry(input, currentNow);
      onSaved(saved);
    } catch (caught) {
      if (!isEntryValidationError(caught)) throw caught;
      setError(caught.message);
    }
  };

  const remove = () => {
    if (request.mode !== "edit") return;
    deleteEntry(request.entry.id);
    onClose();
  };

  const total = sumMoney(draft.rows.map(rowRevenue));

  return (
    <form
      noValidate
      onSubmit={save}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4 leading-prototype",
        isSheet && "pt-2 pb-0",
      )}
    >
      {/* 1. Title and date, with the gold accent bar */}
      <div className="flex items-stretch gap-2.5">
        <span aria-hidden="true" className="w-1 flex-none rounded-pill bg-primary" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Card className="gap-0 rounded-card py-0 ring-0">
            <Label htmlFor={`${fieldId}-title`} className="sr-only">
              Title
            </Label>
            <PopoverField
              id={`${fieldId}-title`}
              ref={titleRef}
              type="text"
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Title of this sale"
              autoComplete="off"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="min-h-14 px-3.5 py-3 font-display text-entry-title font-semibold md:text-entry-title"
            />
          </Card>
          <Card className="gap-0.5 rounded-card px-0.5 pt-1 pb-2 ring-0">
            <Label htmlFor={`${fieldId}-date`} className="sr-only">
              Date and time
            </Label>
            <PopoverField
              id={`${fieldId}-date`}
              type="datetime-local"
              max={now}
              value={draft.date}
              onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
              className="tabular font-semibold scheme-dark"
            />
            <span className="tabular px-3 text-label text-muted-foreground">{formatEntryDateTime(draft.date)}</span>
          </Card>
        </div>
      </div>

      {/* 2. Products */}
      <Card className="gap-2 rounded-card p-3 ring-0">
        <div
          aria-hidden="true"
          className={cn(ROW_GRID, "hidden text-label-sm font-semibold text-muted-foreground rows:grid")}
        >
          <span>Product</span>
          <span>Price ₱</span>
          <span>Qty</span>
          <span className="text-right">Revenue</span>
          <span />
        </div>
        {draft.rows.map((row, index) => {
          const n = index + 1;
          return (
            <div
              key={row.key}
              className={cn(
                ROW_GRID,
                "items-end rounded-control border border-input p-2 rows:items-center rows:border-0 rows:p-0",
              )}
            >
              <PopoverField
                boxed
                type="text"
                list="product-names"
                autoComplete="off"
                placeholder="Product name"
                aria-label={`Product ${n} name`}
                value={row.name}
                onChange={(event) => onName(row.key, event.target.value)}
                className="col-span-full px-2.5 py-2 rows:col-span-1"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <Label
                  htmlFor={`${fieldId}-price-${row.key}`}
                  className="text-label-sm font-semibold text-muted-foreground rows:sr-only"
                >
                  Price ₱
                </Label>
                <PopoverField
                  boxed
                  id={`${fieldId}-price-${row.key}`}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  aria-label={`Product ${n} price`}
                  value={row.price}
                  onChange={(event) => setRow(row.key, () => ({ price: event.target.value, autoPrice: false }))}
                  className="tabular px-2 py-2"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label
                  htmlFor={`${fieldId}-qty-${row.key}`}
                  className="text-label-sm font-semibold text-muted-foreground rows:sr-only"
                >
                  Qty
                </Label>
                <PopoverField
                  boxed
                  id={`${fieldId}-qty-${row.key}`}
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  aria-label={`Product ${n} quantity`}
                  value={row.qty}
                  onChange={(event) => setRow(row.key, () => ({ qty: event.target.value }))}
                  className="tabular px-2 py-2"
                />
              </div>
              <Money
                amount={rowRevenue(row)}
                aria-label={`Product ${n} revenue`}
                className="order-last col-span-full text-right text-body font-semibold text-foreground rows:order-none rows:col-span-1"
              />
              {index > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove product ${n}`}
                  onClick={() =>
                    setDraft((current) => ({ ...current, rows: current.rows.filter((r) => r.key !== row.key) }))
                  }
                  className="h-touch w-9 rounded-control text-destructive hover:text-destructive [&_svg:not([class*='size-'])]:size-3.75"
                >
                  <XIcon />
                </Button>
              ) : (
                <span />
              )}
            </div>
          );
        })}
        <datalist id="product-names">
          {suggestions.map((suggestion) => (
            <option key={suggestion.productName} value={suggestion.productName} />
          ))}
        </datalist>
        <div className="flex items-center justify-between gap-2.5 border-t border-dashed border-input pt-1.5">
          <TextButton onClick={() => setDraft((current) => ({ ...current, rows: [...current.rows, newRow()] }))}>
            + Add product
          </TextButton>
          <span className="flex items-baseline gap-2">
            <span className="text-label text-muted-foreground">Total</span>
            <Money amount={total} className="text-sum font-bold text-primary" />
          </span>
        </div>
      </Card>

      {/* 3. Note */}
      <Card className="gap-0 rounded-card py-0 ring-0">
        <Label htmlFor={`${fieldId}-note`} className="sr-only">
          Note
        </Label>
        <PopoverTextArea
          id={`${fieldId}-note`}
          rows={3}
          placeholder="Add notes"
          value={draft.note}
          onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
          className="min-h-0 resize-y px-3.5 py-3 leading-normal"
        />
      </Card>

      {/* 4. Error */}
      {error && (
        <p role="alert" className="m-0 rounded-control bg-danger-bg px-3 py-2.5 text-body text-danger-alert-text">
          {error}
        </p>
      )}

      {/* 5. Actions (sticky at the bottom of the phone sheet) */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          isSheet && "sticky bottom-0 -mx-4 mt-auto bg-popover px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]",
        )}
      >
        {isEdit && <DangerButton onClick={remove}>Delete</DangerButton>}
        <span className="flex-1" />
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton type="submit" className="px-4.5">
          Save
        </PrimaryButton>
      </div>
    </form>
  );
};

interface EntryPopoverProps {
  request: EntryRequest;
  placement: EntryPlacement;
  suggestions: ProductSuggestion[];
  now: LocalDateTime;
  onClose: () => void;
  onSaved: (entry: SalesEntry) => void;
}

/** Popup look shared by the anchored Popover and the centered Dialog (§7.7). */
const POPUP =
  "flex max-h-[calc(100dvh-24px)] w-popover max-w-none flex-col gap-0 rounded-popover border border-input bg-popover p-0 text-base text-foreground shadow-popover ring-0 sm:max-w-none";

/** §7.7 entry popover (create and edit) in the container that fits the screen (§8.4). */
export const EntryPopover = ({ request, placement, suggestions, now, onClose, onSaved }: EntryPopoverProps) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const sheetTitleRef = useRef<HTMLHeadingElement>(null);
  const label = request.mode === "edit" ? "Edit sales entry" : "New sales entry";
  const onOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  const form = (isSheet: boolean): ReactNode => (
    <EntryForm
      request={request}
      suggestions={suggestions}
      now={now}
      isSheet={isSheet}
      titleRef={titleRef}
      onClose={onClose}
      onSaved={onSaved}
    />
  );

  if (placement === "anchored" && request.anchor) {
    return (
      <Popover open modal onOpenChange={onOpenChange}>
        <PopoverContent
          anchor={request.anchor}
          side="right"
          align="start"
          sideOffset={14}
          // §7.7: top = cell's vertical middle − 90, kept 12px inside the viewport
          alignOffset={({ anchor }) => anchor.height / 2 - 90}
          collisionPadding={12}
          initialFocus={titleRef}
          className={POPUP}
        >
          <PopoverTitle className="sr-only">{label}</PopoverTitle>
          <PopoverArrow className="size-arrow border-b border-l border-input bg-popover data-[side=left]:-right-2.25 data-[side=left]:rotate-225 data-[side=right]:-left-2.25 data-[side=right]:rotate-45" />
          {form(false)}
        </PopoverContent>
      </Popover>
    );
  }

  if (placement === "sheet") {
    return (
      <Drawer open onOpenChange={onOpenChange}>
        <DrawerContent
          overlayProps={scrimProps("centered", "Close entry")}
          initialFocus={sheetTitleRef}
          className="border-input text-base text-foreground data-[swipe-axis=y]:[--drawer-content-max-height:90dvh] data-[swipe-direction=down]:rounded-t-popover"
        >
          <DrawerSwipeHandle className="pt-2.5 after:bg-input group-data-[swipe-axis=y]/drawer-popup:after:w-10" />
          <DrawerTitle ref={sheetTitleRef} tabIndex={-1} className="sr-only">
            {label}
          </DrawerTitle>
          {form(true)}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayProps={scrimProps("centered", "Close entry")}
        initialFocus={titleRef}
        className={cn(POPUP, "overflow-hidden")}
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        {form(false)}
      </DialogContent>
    </Dialog>
  );
};
