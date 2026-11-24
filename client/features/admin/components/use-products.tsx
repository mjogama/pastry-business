"use client";

import type { UpdateProductInput } from "@common/modules/product";
import { type ReactNode, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Category, Product } from "@/features/menu/types";
import { apiErrorMessage } from "@/lib/api/errors";
import { refreshPublicMenu } from "../actions";
import { deleteProduct, updateProduct } from "../api";
import { ProductFormDialog } from "./product-form-dialog";

type Editing = { product: Product } | { categoryId?: string } | null;

/**
 * Product list state for the CMS pages, plus the dialogs that change it. Every save goes to the
 * API first and then refreshes the public pages' cache, so what the owner sees is what customers get.
 */
export const useProducts = (initialProducts: Product[], initialCategories: Category[]) => {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const upsert = useCallback((product: Product) => {
    setProducts((all) =>
      all.some((p) => p.id === product.id) ? all.map((p) => (p.id === product.id ? product : p)) : [...all, product],
    );
    void refreshPublicMenu();
  }, []);

  /** Changes a few fields right away (switches, archive); shows the error if the API refuses. */
  const patch = useCallback(
    async (product: Product, changes: UpdateProductInput) => {
      setError(null);
      try {
        upsert(await updateProduct(product.id, changes));
      } catch (e) {
        setError(apiErrorMessage(e));
      }
    },
    [upsert],
  );

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    try {
      await deleteProduct(deleting.id);
      setProducts((all) => all.filter((p) => p.id !== deleting.id));
      void refreshPublicMenu();
      setDeleting(null);
      setError(null);
    } catch (e) {
      setError(apiErrorMessage(e));
      setDeleting(null);
    } finally {
      setPending(false);
    }
  }

  const dialogs: ReactNode = (
    <>
      {editing && (
        <ProductFormDialog
          key={"product" in editing ? editing.product.id : "new"}
          product={"product" in editing ? editing.product : undefined}
          defaultCategoryId={"categoryId" in editing ? editing.categoryId : undefined}
          categories={categories}
          products={products}
          onCategoryCreated={(category) => setCategories((all) => [...all, category])}
          onSaved={upsert}
          onClose={() => setEditing(null)}
        />
      )}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              This removes it from the menu for good. To hide it and keep it, archive it instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return {
    products,
    categories,
    error,
    dismissError: () => setError(null),
    patch,
    openCreate: (categoryId?: string) => setEditing(categoryId ? { categoryId } : {}),
    openEdit: (product: Product) => setEditing({ product }),
    askDelete: setDeleting,
    dialogs,
  };
};
