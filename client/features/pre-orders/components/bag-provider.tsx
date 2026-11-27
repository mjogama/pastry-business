"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { ProductView } from "@/features/menu/types";

import { BagBar } from "./bag-bar";
import { CheckoutSheet } from "./checkout-sheet";

export const MAX_QUANTITY = 50;
export const MAX_LINES = 20;

/** The bag survives a reload on this device; it is a convenience, not a record. */
const STORAGE_KEY = "pato.preorder.bag";

export interface BagLine {
  product: ProductView;
  quantity: number;
}

interface BagContextValue {
  lines: BagLine[];
  /** Pieces in the bag. */
  count: number;
  quantityOf: (productId: string) => number;
  add: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  openCheckout: () => void;
}

const BagContext = createContext<BagContextValue | null>(null);

/** Null outside a bag (pre-orders closed, or the CMS), so callers render no pre-order controls. */
export const useBag = () => useContext(BagContext);

const clamp = (quantity: number) => Math.max(0, Math.min(MAX_QUANTITY, Math.floor(quantity)));

/**
 * The pre-order bag on /menu: which products and how many, the sticky bag bar and the checkout
 * sheet. Only available products can go in; anything no longer on the menu drops out on load.
 */
export const BagProvider = ({ products, children }: { products: ProductView[]; children: ReactNode }) => {
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
      const valid = Object.entries(saved).flatMap(([id, quantity]) =>
        typeof quantity === "number" && byId.get(id)?.isAvailable && clamp(quantity) > 0
          ? [[id, clamp(quantity)] as const]
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
    (productId: string, quantity: number) => {
      if (!byId.get(productId)?.isAvailable) return;
      setQuantities((current) => {
        const next = { ...current };
        const value = clamp(quantity);
        if (value === 0) delete next[productId];
        else if (productId in next || Object.keys(next).length < MAX_LINES) next[productId] = value;
        return next;
      });
    },
    [byId],
  );

  const add = useCallback(
    (productId: string, quantity: number) =>
      setQuantities((current) => {
        if (!byId.get(productId)?.isAvailable) return current;
        if (!(productId in current) && Object.keys(current).length >= MAX_LINES) return current;
        return { ...current, [productId]: clamp((current[productId] ?? 0) + quantity) };
      }),
    [byId],
  );

  const lines = useMemo(
    () =>
      Object.entries(quantities).flatMap(([id, quantity]) => {
        const product = byId.get(id);
        return product ? [{ product, quantity }] : [];
      }),
    [quantities, byId],
  );

  const value = useMemo<BagContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      quantityOf: (productId) => quantities[productId] ?? 0,
      add,
      setQuantity,
      clear: () => setQuantities({}),
      openCheckout: () => setCheckoutOpen(true),
    }),
    [lines, quantities, add, setQuantity],
  );

  return (
    <BagContext.Provider value={value}>
      {children}
      <BagBar />
      <CheckoutSheet open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </BagContext.Provider>
  );
};
