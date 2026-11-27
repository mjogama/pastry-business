"use client";

import type { PreOrder } from "@common/modules/pre-order";
import { CheckCircle2Icon } from "lucide-react";
import { type ComponentType, type FormEvent, type ReactNode, useEffect, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerSwipeHandle, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { CloseIcon } from "@/features/menu/components/icons";
import { Money, scrimProps } from "@/features/sales-tracker/components/ui/primitives";
import { PHONE_QUERY, useMediaQuery, useNow } from "@/features/sales-tracker/hooks/use-environment";
import { apiErrorMessage, isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { createPreOrder } from "../api";
import { dayLabel, orderTotal, pickupDays, priceOnDay, totalOf } from "../lib/days";
import { MAX_QUANTITY, useBag } from "./bag-provider";
import { QuantityStepper } from "./quantity-stepper";

/** Name, email and section are remembered on this device for the next order. */
/** A label wrapping its field: text above, field below. */
const FIELD_LABEL = "flex-col items-stretch gap-1.5 text-base leading-normal font-normal select-auto";

const CUSTOMER_KEY = "pato.preorder.customer";

const SCRIM = scrimProps("centered", "Close pre-order");

const FIELD =
  "h-auto min-h-touch rounded-control border border-border bg-surface-inset px-3 py-2.5 text-body-lg text-foreground placeholder:text-foreground-faint md:text-body-lg";

interface Customer {
  customerName: string;
  email: string;
  handoff: string;
}

const EMPTY_CUSTOMER: Customer = { customerName: "", email: "", handoff: "" };

/** Checkout: a centered Dialog from 640px, a bottom-sheet Drawer below it (like the product sheet). */
export const CheckoutSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const close = () => onOpenChange(false);

  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent variant="product" overlayProps={SCRIM}>
          <DrawerSwipeHandle className="h-auto pt-2.5 after:bg-input group-data-[swipe-axis=y]/drawer-popup:h-auto group-data-[swipe-axis=y]/drawer-popup:after:h-1.25 group-data-[swipe-axis=y]/drawer-popup:after:w-11" />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
            <CheckoutBody open={open} onClose={close} Title={DrawerTitle} Description={DrawerDescription} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="product" showCloseButton={false} overlayProps={SCRIM}>
        <CheckoutBody open={open} onClose={close} Title={DialogTitle} Description={DialogDescription} />
      </DialogContent>
    </Dialog>
  );
};

type TextPart = ComponentType<{ className?: string; children: ReactNode }>;

const CheckoutBody = ({
  open,
  onClose,
  Title,
  Description,
}: {
  open: boolean;
  onClose: () => void;
  Title: TextPart;
  Description: TextPart;
}) => {
  const bag = useBag();
  const id = useId();
  // Manila "today" from the browser clock; null while prerendering (a render can't read the clock).
  const today = useNow()?.slice(0, 10) ?? null;
  const days = useMemo(() => (today ? pickupDays(today) : []), [today]);
  const [day, setDay] = useState("");
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; fields: Record<string, string> } | null>(null);
  const [placed, setPlaced] = useState<PreOrder | null>(null);

  // Keep the chosen day valid as the date moves on (and pick the first one to start).
  useEffect(() => {
    setDay((current) => (days.includes(current) ? current : (days[0] ?? "")));
  }, [days]);

  // Each time checkout opens, the saved details fill in.
  useEffect(() => {
    if (!open) return;
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "null") as Partial<Customer> | null;
      if (saved) setCustomer((current) => ({ ...current, ...saved }));
    } catch {}
  }, [open]);

  if (!bag) return null;

  const lines = bag.lines.map(({ product, quantity }) => ({ product, quantity, price: priceOnDay(product, day) }));
  const total = totalOf(lines);

  const update = (key: keyof Customer) => (value: string) => setCustomer((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!bag || bag.lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await createPreOrder({
        ...customer,
        pickupDate: day,
        note,
        items: bag.lines.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        ...(website && { website }),
      });
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
      } catch {}
      bag.clear();
      setNote("");
      setPlaced(order);
    } catch (e) {
      setError({ message: apiErrorMessage(e), fields: isApiError(e) ? e.fieldErrors : {} });
    } finally {
      setSubmitting(false);
    }
  }

  const finish = () => {
    setPlaced(null);
    onClose();
  };

  if (placed) {
    return (
      <div className="flex flex-col gap-5 px-6 pt-8 pb-7">
        <CheckCircle2Icon aria-hidden="true" className="size-10 text-status-available" />
        <Title className="font-display text-sheet-title font-bold text-foreground">Pre-order sent!</Title>
        <Description className="text-body-lg text-foreground-2">
          We’ll confirm it by email ({placed.email}) and hand it over at school on{" "}
          <strong className="text-foreground">{dayLabel(placed.pickupDate)}</strong>. Pay{" "}
          <Money amount={orderTotal(placed)} className="font-bold text-foreground" /> when you get it.
        </Description>
        <div className="flex flex-col gap-1 rounded-card border border-dashed border-input bg-surface-note px-4 py-3.5">
          <span className="text-label-sm font-bold tracking-eyebrow-sm text-honey uppercase">Order code</span>
          <span className="font-mono text-sheet-title font-bold tracking-widest text-foreground">{placed.code}</span>
        </div>
        <Button size="call" onClick={finish}>
          Done
        </Button>
      </div>
    );
  }

  const fieldError = (key: string) =>
    error?.fields[key] ? (
      <span id={`${id}-${key}-error`} className="text-label text-destructive">
        {error.fields[key]}
      </span>
    ) : null;
  const errorProps = (key: string) =>
    error?.fields[key] ? { "aria-invalid": true, "aria-describedby": `${id}-${key}-error` } : {};

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 px-6 pt-6 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-label-sm font-bold tracking-eyebrow-sm text-honey uppercase">Pre-order</span>
          <Title className="font-display text-sheet-title font-bold text-foreground">Your bag</Title>
          <Description className="text-body text-muted-foreground">
            Pick a school day. We hand it over at school and you pay then.
          </Description>
        </div>
        <Button type="button" variant="overlay" size="icon-touch" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </Button>
      </div>

      {lines.length === 0 ? (
        <p className="text-body-lg text-muted-foreground">Your bag is empty. Add items from the menu.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
          {lines.map(({ product, quantity, price }) => (
            <li key={product.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body-lg font-semibold text-foreground">{product.name}</span>
                <span className="text-label text-muted-foreground">
                  <Money amount={price} /> each
                </span>
              </span>
              <QuantityStepper
                value={quantity}
                min={0}
                max={MAX_QUANTITY}
                label={product.name}
                onChange={(value) => bag.setQuantity(product.id, value)}
              />
            </li>
          ))}
        </ul>
      )}

      <Label className={FIELD_LABEL}>
        <span className="text-label font-semibold text-foreground">School day</span>
        <NativeSelect
          value={day}
          onChange={(e) => setDay(e.target.value)}
          required
          {...errorProps("pickupDate")}
          className="text-body-lg"
        >
          {days.map((d) => (
            <NativeSelectOption key={d} value={d}>
              {dayLabel(d, today ?? undefined)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {fieldError("pickupDate")}
      </Label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Label className={FIELD_LABEL}>
          <span className="text-label font-semibold text-foreground">Your name</span>
          <Input
            className={FIELD}
            value={customer.customerName}
            onChange={(e) => update("customerName")(e.target.value)}
            autoComplete="name"
            maxLength={60}
            required
            {...errorProps("customerName")}
          />
          {fieldError("customerName")}
        </Label>
        <Label className={FIELD_LABEL}>
          <span className="text-label font-semibold text-foreground">Grade & section</span>
          <Input
            className={FIELD}
            value={customer.handoff}
            onChange={(e) => update("handoff")(e.target.value)}
            placeholder="e.g. Grade 8 – Rizal"
            maxLength={80}
            required
            {...errorProps("handoff")}
          />
          {fieldError("handoff")}
        </Label>
      </div>

      <Label className={FIELD_LABEL}>
        <span className="text-label font-semibold text-foreground">Email</span>
        <Input
          className={FIELD}
          type="email"
          value={customer.email}
          onChange={(e) => update("email")(e.target.value)}
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          required
          {...errorProps("email")}
        />
        <span className="text-label text-muted-foreground">We’ll email you when it’s confirmed.</span>
        {fieldError("email")}
      </Label>

      <Label className={FIELD_LABEL}>
        <span className="text-label font-semibold text-foreground">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <Textarea
          className={cn(FIELD, "min-h-20")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          rows={2}
        />
      </Label>

      {/* Honeypot: hidden from people and screen readers; bots that fill it are refused. */}
      <Input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />

      {error && (
        <p role="alert" className="text-label text-destructive">
          {error.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
        <span className="text-body-lg text-foreground-2">Pay at hand-over</span>
        <Money amount={total} className="text-sheet-title font-bold text-honey" />
      </div>

      <Button type="submit" size="call" disabled={submitting || lines.length === 0 || !day}>
        {submitting ? "Sending…" : "Place pre-order"}
      </Button>
    </form>
  );
};
