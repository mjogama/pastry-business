import { env } from "@app/config/env";
import { logger } from "@shared/logger";
import type { PreOrder } from "./pre-order.schema";

export type PreOrderEmailKind = "placed" | "confirmed" | "cancelled";

export interface PreOrderMailer {
  /** Never throws: a failed email is logged and the request carries on. */
  send(kind: PreOrderEmailKind, order: PreOrder, businessName: string): Promise<void>;
}

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

const dayText = (day: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(
    new Date(`${day}T00:00:00Z`),
  );

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export const orderTotal = (order: Pick<PreOrder, "items">) =>
  Math.round(order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

/** Subject and HTML body for one email. Exported for tests. */
export const renderPreOrderEmail = (kind: PreOrderEmailKind, order: PreOrder, businessName: string) => {
  const day = dayText(order.pickupDate);
  const heading = {
    placed: `We got your pre-order for ${day}`,
    confirmed: `Your pre-order for ${day} is confirmed`,
    cancelled: `Your pre-order for ${day} was cancelled`,
  }[kind];
  const message = {
    placed: "We’ll confirm it soon. You pay when we hand it over at school.",
    confirmed: `We’ll bake it for you and hand it over at school (${escapeHtml(order.handoff)}). Please have ${peso.format(orderTotal(order))} ready.`,
    cancelled: order.cancelReason
      ? `Reason: ${escapeHtml(order.cancelReason)}`
      : "Sorry about that. You can place a new pre-order on our menu anytime.",
  }[kind];
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:4px 12px 4px 0">${item.quantity} × ${escapeHtml(item.productName)}</td><td style="padding:4px 0;text-align:right">${peso.format(item.price * item.quantity)}</td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:system-ui,sans-serif;color:#2b2118;max-width:520px">
<h2 style="margin:0 0 8px">${escapeHtml(heading)}</h2>
<p style="margin:0 0 16px">Hi ${escapeHtml(order.customerName)}, ${message}</p>
<p style="margin:0 0 8px"><strong>Order ${order.code}</strong> · ${escapeHtml(day)}</p>
<table style="border-collapse:collapse;width:100%">${rows}
<tr><td style="padding:8px 12px 0 0;border-top:1px solid #ddd"><strong>Total</strong></td><td style="padding:8px 0 0;border-top:1px solid #ddd;text-align:right"><strong>${peso.format(orderTotal(order))}</strong></td></tr></table>
<p style="margin:24px 0 0;color:#6b5d4f">${escapeHtml(businessName)}</p></div>`;
  return { subject: `${heading} · ${order.code}`, html };
};

/** Sends through the Resend HTTP API. Skipped when `RESEND_API_KEY` or `EMAIL_FROM` is unset. */
export class ResendPreOrderMailer implements PreOrderMailer {
  constructor(
    private readonly apiKey = env.RESEND_API_KEY,
    private readonly from = env.EMAIL_FROM,
  ) {}

  async send(kind: PreOrderEmailKind, order: PreOrder, businessName: string): Promise<void> {
    if (!this.apiKey || !this.from) return;
    const { subject, html } = renderPreOrderEmail(kind, order, businessName);
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: this.from, to: [order.email], subject, html }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        logger.warn({ status: response.status, code: order.code, kind }, "Pre-order email was not sent");
      }
    } catch (error) {
      logger.warn({ err: error, code: order.code, kind }, "Pre-order email failed");
    }
  }
}
