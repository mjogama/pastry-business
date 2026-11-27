"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { PriceView, ProductView, SizeView } from "@/features/menu/types";

import type { PreOrderSchedule } from "../lib/days";

import { BagBar } from "./bag-bar";
import { CheckoutSheet } from "./checkout-sheet";

export const MAX_QUANTITY = 50;
export const MAX_LINES = 20;

/** The bag survives a reload on this device; it is a convenience, not a record. */
const STORAGE_KEY = "pato.preorder.bag";

/** `productId`, or `productId::size` for a product with sizes. */
export type LineKey = string;

const SEPARATOR = "::";

export const lineKey = (productId: string, size?: Pick<SizeView, "name">): LineKey =>
  size ? `${productId}${SEPARATOR}${size.name}` : productId;

export interface BagLine {
  key: LineKey;
  product: ProductView;
  /** Set for a product with sizes. */
  size?: SizeView;
  /** The size's price, or the product's. */
  unit: PriceView;
  /** `Ube Cake (Large)`, or the product name. */
  label: string;
  quantity: number;
}

/** The line a key names, while that product (and size) is on the menu and available; otherwise null. */
const resolve = (key: LineKey, byId: Map<string, ProductView>): Omit<BagLine, "quantity"> | null => {
  const [productId = "", sizeName] = key.split(SEPARATOR);
  const product = byId.get(productId);
  if (!product) return null;
  if (product.sizes.length === 0) {
    return sizeName === undefined && product.isAvailable ? { key, product, unit: product, label: product.name } : null;
  }
  const size = product.sizes.find((s) => s.name === sizeName);
  return size?.isAvailable ? { key, product, size, unit: size, label: `${product.name} (${size.name})` } : null;
};

interface BagContextValue {
  lines: BagLine[];
  /** Pieces in the bag. */
  count: number;
  quantityOf: (key: LineKey) => number;
  add: (key: LineKey, quantity: number) => void;
  setQuantity: (key: LineKey, quantity: number) => void;
  clear: () => void;
  openCheckout: () => void;
  /** Which days orders are handed over, the cut-off and the time. */
  schedule: PreOrderSchedule;
}

const BagContext = createContext<BagContextValue | null>(null);

/** Null outside a bag (pre-orders closed, or the CMS), so callers render no pre-order controls. */
export const useBag = () => useContext(BagContext);

const clamp = (quantity: number) => Math.max(0, Math.min(MAX_QUANTITY, Math.floor(quantity)));

/**
 * The pre-order bag on /menu: which products (and sizes) and how many, the sticky bag bar and the
 * checkout sheet. Only available ones can go in; anything no longer on the menu drops out on load.
 */
export const BagProvider = ({
  products,
  schedule,
  children,
}: {
  products: ProductView[];
  schedule: PreOrderSchedule;
  children: ReactNode;
}) => {
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
      const valid = Object.entries(saved).flatMap(([key, quantity]) =>
        typeof quantity === "number" && resolve(key, byId) && clamp(quantity) > 0
          ? [[key, clamp(quantity)] as const]
          : [],
      );
      setQuantities(Object.fromEntries(valid.slice(0, MAX_LINES)));
    } catch {}
    setLoaded(true);
  }, [byId]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quantities));
    } catch {}
  }, [quantities, loaded]);

  const setQuantity = useCallback(
    (key: LineKey, quantity: number) => {
      if (!resolve(key, byId)) return;
      setQuantities((current) => {
        const next = { ...current };
        const value = clamp(quantity);
        if (value === 0) delete next[key];
        else if (key in next || Object.keys(next).length < MAX_LINES) next[key] = value;
        return next;
      });
    },
    [byId],
  );

  const add = useCallback(
    (key: LineKey, quantity: number) =>
      setQuantities((current) => {
        if (!resolve(key, byId)) return current;
        if (!(key in current) && Object.keys(current).length >= MAX_LINES) return current;
        return { ...current, [key]: clamp((current[key] ?? 0) + quantity) };
      }),
    [byId],
  );

  const lines = useMemo(
    () =>
      Object.entries(quantities).flatMap(([key, quantity]): BagLine[] => {
        const line = resolve(key, byId);
        return line ? [{ ...line, quantity }] : [];
      }),
    [quantities, byId],
  );

  const value = useMemo<BagContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      quantityOf: (key) => quantities[key] ?? 0,
      add,
      setQuantity,
      clear: () => setQuantities({}),
      openCheckout: () => setCheckoutOpen(true),
      schedule,
    }),
    [lines, quantities, add, setQuantity, schedule],
  );

  return (
    <BagContext.Provider value={value}>
      {children}
      <BagBar />
      <CheckoutSheet open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </BagContext.Provider>
  );
};
