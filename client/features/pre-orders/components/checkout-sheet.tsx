"use client";

import type { PreOrder } from "@common/modules/pre-order";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import {
  type ComponentType,
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerSwipeHandle, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { CloseIcon } from "@/features/menu/components/icons";
import { itemCount } from "@/features/menu/lib/menu";
import { Money, scrimProps } from "@/features/sales-tracker/components/ui/primitives";
import { PHONE_QUERY, useMediaQuery, useNow } from "@/features/sales-tracker/hooks/use-environment";
import { apiErrorMessage, isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { createPreOrder } from "../api";
import { dayLabel, orderTotal, pickupDays, priceOnDay, totalOf, weekdaysText } from "../lib/days";
import { MAX_QUANTITY, useBag } from "./bag-provider";
import { QuantityStepper } from "./quantity-stepper";

/** Name, email and contact number are remembered on this device for the next order. */
/** A label wrapping its field: text above, field below. */
const FIELD_LABEL = "flex-col items-stretch gap-1.5 text-base leading-normal font-normal select-auto";

const CUSTOMER_KEY = "pato.preorder.customer";

type SendPhase = "idle" | "sending" | "done";

/** How long the drawn check stays in the popup before it closes onto "Pre-order sent!". */
const DONE_HOLD_MS = 1100;

const prefersReducedMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/** Up to 4 short notes of 60 characters: joined with line breaks they stay within the server’s 300. */
const MAX_NOTES = 4;
const NOTE_MAX = 60;

const SCRIM = scrimProps("centered", "Close pre-order");

/**
 * Black backdrop for the hand-over details, so the checkout behind fades out. `forceRender`: Base UI
 * skips a nested dialog's backdrop by default, which left the checkout undimmed.
 */
const CONFIRM_SCRIM = { forceRender: true, className: "bg-scrim-confirm supports-backdrop-filter:backdrop-blur-none" };

const FIELD =
  "h-auto min-h-touch rounded-control border border-border bg-surface-inset px-3 py-2.5 text-body-lg text-foreground placeholder:text-foreground-faint md:text-body-lg";

interface Customer {
  customerName: string;
  email: string;
  contactNumber: string;
}

const EMPTY_CUSTOMER: Customer = { customerName: "", email: "", contactNumber: "" };

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
  const now = useNow();
  const today = now?.slice(0, 10) ?? null;
  const schedule = bag?.schedule;
  const days = useMemo(() => (now && schedule ? pickupDays(now, schedule) : []), [now, schedule]);
  const [day, setDay] = useState("");
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  /** Short notes, sent as one note (a line each). */
  const [notes, setNotes] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  /** Confirm button: idle, then a spinning ring while sending, then a drawn check before the popup closes. */
  const [phase, setPhase] = useState<SendPhase>("idle");
  const submitting = phase !== "idle";
  const [error, setError] = useState<{ message: string; fields: Record<string, string> } | null>(null);
  const [placed, setPlaced] = useState<PreOrder | null>(null);
  /** The hand-over details modal, shown before the order is sent; `understood` gates its button. */
  const [confirming, setConfirming] = useState(false);
  const [understood, setUnderstood] = useState(false);

  // Keep the chosen day valid as the date moves on (and pick the first one to start).
  useEffect(() => {
    setDay((current) => (days.includes(current) ? current : (days[0] ?? "")));
  }, [days]);

  // A new checkout starts on the form, not on the last order's "Pre-order sent!". Before paint, so it
  // never shows for a frame.
  useLayoutEffect(() => {
    if (open) setPlaced(null);
  }, [open]);

  // Each time checkout opens, the saved details fill in.
  useEffect(() => {
    if (!open) return;
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "null") as Partial<Customer> | null;
      if (saved) {
        // Only the fields checkout still asks for (older saves also hold a grade & section).
        setCustomer((current) => ({
          customerName: saved.customerName ?? current.customerName,
          email: saved.email ?? current.email,
          contactNumber: saved.contactNumber ?? current.contactNumber,
        }));
      }
    } catch {}
  }, [open]);

  if (!bag) return null;

  const lines = bag.lines.map((line) => ({ ...line, price: priceOnDay(line.unit, day) }));
  const total = totalOf(lines);

  const update = (key: keyof Customer) => (value: string) => setCustomer((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!bag || bag.lines.length === 0) return;
    setUnderstood(false);
    setConfirming(true);
  }

  async function place() {
    if (!bag || bag.lines.length === 0) return;
    setPhase("sending");
    setError(null);
    try {
      const order = await createPreOrder({
        ...customer,
        pickupDate: day,
        note: notes
          .map((n) => n.trim())
          .filter(Boolean)
          .join("\n"),
        items: bag.lines.map(({ product, size, quantity }) => ({
          productId: product.id,
          ...(size && { variant: size.name }),
          quantity,
        })),
        ...(website && { website }),
      });
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
      } catch {}
      // Let the check finish drawing in the popup, then close it onto the success view in one step,
      // so the popup never fades out over a half-changed checkout.
      setPhase("done");
      await new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 400 : DONE_HOLD_MS));
      bag.clear();
      setNotes([]);
      setConfirming(false);
      setPlaced(order);
      setPhase("idle");
    } catch (e) {
      setPhase("idle");
      setConfirming(false);
      setError({ message: apiErrorMessage(e), fields: isApiError(e) ? e.fieldErrors : {} });
    }
  }

  // Close with "Pre-order sent!" still showing; it is cleared the next time checkout opens (below),
  // so the closing sheet never flashes the emptied cart form.
  const finish = () => onClose();

  if (placed) {
    return (
      <div className="flex flex-col gap-5 px-6 pt-8 pb-7">
        <div className="flex justify-between items-center">
          <Title className="font-display text-sheet-title font-bold text-foreground">Pre-order sent!</Title>
          <CheckCircle2Icon
            aria-hidden="true"
            className="size-10 animate-pop text-status-available motion-reduce:animate-none"
          />
        </div>
        <Description className="text-body-lg text-foreground-2">
          We’ll confirm it by email ({placed.email}) and hand it over at school on{" "}
          <strong className="text-foreground">{dayLabel(placed.pickupDate)}</strong>
          {bag.schedule.preOrderHandoffTime && <>, {bag.schedule.preOrderHandoffTime}</>}. Pay{" "}
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
        <div className="flex items-center gap-1.5">
          <Title className="font-display text-sheet-title font-bold text-honey">Pre-order Cart</Title>
          {/* <span className="text-label-sm font-bold tracking-eyebrow-sm text-honey uppercase">Pre-order</span> */}
        </div>
        <Button type="button" variant="overlay" size="icon-touch" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </Button>
      </div>

      {lines.length === 0 ? (
        <p className="text-body-lg text-muted-foreground">Your cart is empty. Add items from the menu.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
          {lines.map(({ key, label, quantity, price }) => (
            <li key={key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body-lg font-semibold text-foreground">{label}</span>
                <span className="text-label text-muted-foreground">
                  <Money amount={price} /> each
                </span>
              </span>
              <QuantityStepper
                value={quantity}
                min={0}
                max={MAX_QUANTITY}
                label={label}
                onChange={(value) => bag.setQuantity(key, value)}
              />
            </li>
          ))}
        </ul>
      )}

      <Label className={FIELD_LABEL}>
        <span className="text-label font-semibold text-foreground">Available date of delivery</span>
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

      <div className="grid gap-4 sm:grid-cols-2">
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

          {fieldError("email")}
        </Label>

        <Label className={FIELD_LABEL}>
          <span className="text-label font-semibold text-foreground">Contact number</span>
          <Input
            className={FIELD}
            type="tel"
            value={customer.contactNumber}
            onChange={(e) => update("contactNumber")(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            placeholder="e.g. 0917 123 4567"
            maxLength={20}
            required
            {...errorProps("contactNumber")}
          />
          {fieldError("contactNumber")}
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        {notes.length > 0 && <span className="text-label font-semibold text-foreground">Notes</span>}
        {notes.map((value, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: notes have no id; their order is their identity
          <div key={index} className="flex items-center gap-2">
            <Input
              className={cn(FIELD, "flex-1")}
              value={value}
              onChange={(e) => setNotes((all) => all.map((n, i) => (i === index ? e.target.value : n)))}
              placeholder="e.g. Less sugar, please"
              maxLength={NOTE_MAX}
              aria-label={`Note ${index + 1}`}
              // biome-ignore lint/a11y/noAutofocus: focus the note the customer just added
              autoFocus={index === notes.length - 1 && value === ""}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-touch"
              aria-label={`Remove note ${index + 1}`}
              onClick={() => setNotes((all) => all.filter((_, i) => i !== index))}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
        ))}
        {notes.length < MAX_NOTES && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setNotes((all) => [...all, ""])}
            className="min-h-touch self-start px-2 text-body font-semibold text-honey"
          >
            <PlusIcon aria-hidden="true" />
            Add note
          </Button>
        )}
      </div>

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
        <span className="text-body-lg text-muted-foreground">{itemCount(bag.count)} </span>
        <Money amount={total} className="text-sheet-title font-bold text-honey" />
      </div>

      <Button type="submit" size="call" disabled={submitting || lines.length === 0 || !day}>
        Place pre-order
      </Button>

      <HandoffConfirm
        open={confirming}
        onOpenChange={(next) => !submitting && setConfirming(next)}
        day={day}
        handoffTime={bag.schedule.preOrderHandoffTime}
        total={total}
        email={customer.email}
        understood={understood}
        onUnderstoodChange={setUnderstood}
        phase={phase}
        onConfirm={() => void place()}
      />
    </form>
  );
};

/**
 * Shown when the customer presses Place pre-order: the hand-over details they must not miss (we're
 * only at school for a short time). The order is sent only after they tick "I understand" and confirm.
 */
const HandoffConfirm = ({
  open,
  onOpenChange,
  day,
  handoffTime,
  total,
  email,
  understood,
  onUnderstoodChange,
  phase,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: string;
  handoffTime: string;
  total: number;
  email: string;
  understood: boolean;
  onUnderstoodChange: (understood: boolean) => void;
  phase: SendPhase;
  onConfirm: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="gap-5" showCloseButton={false} overlayProps={CONFIRM_SCRIM}>
      <DialogHeader>
        <DialogTitle className="font-display text-sheet-title font-bold text-foreground">
          Please read the hand-over details
        </DialogTitle>
      </DialogHeader>

      <ul className="flex flex-col gap-3.5 text-body-lg text-foreground-2">
        <li className="flex gap-3">
          <CalendarClockIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-honey" />
          <span>
            Hand-over at school on{" "}
            <strong className="text-foreground">{day ? dayLabel(day) : "the day you picked"}</strong>
            {handoffTime && (
              <>
                , <strong className="text-foreground">{handoffTime}</strong>
              </>
            )}
            .
          </span>
        </li>
        <li className="flex gap-3">
          <WalletIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-honey" />
          <span>
            Pay <Money amount={total} className="font-bold text-foreground" /> when you get your order.
          </span>
        </li>
        <li className="flex gap-3">
          <MailIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-honey" />
          <span>
            We’ll email <span className="break-all text-foreground">{email}</span> when it’s confirmed.
          </span>
        </li>
        <li className="flex gap-3">
          <PhoneIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-honey" />
          <span>Can’t make it? Please contact us before the day.</span>
        </li>
      </ul>

      <Button
        type="button"
        variant="bare"
        role="checkbox"
        aria-checked={understood}
        onClick={() => onUnderstoodChange(!understood)}
        className="h-auto min-h-touch justify-start gap-3 rounded-control border border-border bg-surface-inset px-3.5 py-3 text-left text-body-lg font-semibold whitespace-normal text-foreground"
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-sm border",
            understood ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
          )}
        >
          {understood && <CheckIcon className="size-3.5" />}
        </span>
        I understand and will be there on time.
      </Button>

      {/* Same buttons as the checkout: the full-width yellow Place pre-order, the outline one under it. */}
      <div className="flex flex-col gap-2.5">
        {phase === "idle" && (
          <Button type="button" variant="call-outline" size="call" onClick={() => onOpenChange(false)}>
            Go back
          </Button>
        )}
        <ConfirmButton phase={phase} disabled={!understood} onClick={onConfirm} />
      </div>
    </DialogContent>
  </Dialog>
);

/**
 * The popup's Confirm button. While sending it shrinks into a yellow circle with a spinning ring (like
 * an app store download); when the order is in, the ring completes and a check draws in with a pop.
 */
const ConfirmButton = ({ phase, disabled, onClick }: { phase: SendPhase; disabled: boolean; onClick: () => void }) => {
  const busy = phase !== "idle";
  return (
    <Button
      type="button"
      size="call"
      disabled={disabled && !busy}
      aria-disabled={busy || undefined}
      aria-label={phase === "sending" ? "Sending your pre-order" : phase === "done" ? "Pre-order sent" : undefined}
      onClick={busy ? undefined : onClick}
      className={cn(
        "self-center transition-[width,border-radius] duration-300 ease-out motion-reduce:transition-none",
        busy ? "size-14 min-h-0 rounded-full px-0" : "w-full",
      )}
    >
      {phase === "idle" ? "Confirm" : <ProgressCheck done={phase === "done"} />}
    </Button>
  );
};

const STROKE = { fill: "none", stroke: "currentColor", pathLength: 1, strokeLinecap: "round" } as const;

/** A spinning ring while sending; then the full ring and a check, both drawn in, with a pop. */
const ProgressCheck = ({ done }: { done: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-8 overflow-visible">
    {done ? (
      <g className="origin-center animate-pop [transform-box:fill-box] motion-reduce:animate-none">
        <circle
          {...STROKE}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="2"
          strokeDasharray="1"
          strokeDashoffset="1"
          className="-rotate-90 origin-center animate-draw [transform-box:fill-box] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
        />
        <path
          {...STROKE}
          d="M7.5 12.5l3 3 6-6.5"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeDasharray="1"
          strokeDashoffset="1"
          className="animate-draw [animation-delay:250ms] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
        />
      </g>
    ) : (
      <>
        <circle {...STROKE} cx="12" cy="12" r="10" strokeWidth="2" opacity="0.25" />
        <circle
          {...STROKE}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="2"
          strokeDasharray="0.3 1"
          className="origin-center animate-spin [transform-box:fill-box] motion-reduce:animate-none"
        />
      </>
    )}
  </svg>
);
