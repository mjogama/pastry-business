"use client";

import type { CreateProductInput, UpdateProductInput } from "@common/modules/product";
import { type FormEvent, useMemo, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ProductCardContent } from "@/features/menu/components/product-card";
import { toProductView } from "@/features/menu/lib/menu";
import { manilaToday } from "@/features/menu/lib/pricing";
import type { Category, Product } from "@/features/menu/types";
import { apiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { createCategory, createProduct, updateProduct, uploadImage } from "../api";
import { Switch } from "./switch";

const NEW_CATEGORY = "__new__";
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const FIELD = "flex flex-col gap-1.5";
const HINT = "text-label-sm text-foreground-faint";

const toNumber = (value: string) => (value.trim() === "" ? undefined : Number(value));

/**
 * Add / edit product form (docs/MENU_UI_V1.md §9): the fields on the left and a live preview of
 * the menu card on the right. Saves through the API; the server's rules are the final word.
 */
export function ProductFormDialog({
  product,
  defaultCategoryId,
  categories,
  products,
  onCategoryCreated,
  onSaved,
  onClose,
}: {
  product?: Product | undefined;
  defaultCategoryId?: string | undefined;
  categories: Category[];
  products: Product[];
  onCategoryCreated: (category: Category) => void;
  onSaved: (product: Product) => void;
  onClose: () => void;
}) {
  const today = useMemo(() => manilaToday(), []);
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? NEW_CATEGORY,
  );
  const [newCategory, setNewCategory] = useState("");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [discountPrice, setDiscountPrice] = useState(
    product?.discountPrice != null ? String(product.discountPrice) : "",
  );
  const [discountEndsAt, setDiscountEndsAt] = useState(product?.discountEndsAt ?? "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isArchived, setIsArchived] = useState(product?.isArchived ?? false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const category = categories.find((c) => c.id === categoryId);
  const priceNumber = toNumber(price);
  const discountNumber = toNumber(discountPrice);

  const preview = useMemo(
    () =>
      toProductView(
        {
          id: "preview",
          name: name.trim() || "Product name",
          categoryId,
          shortDescription: shortDescription.trim() || "A short description appears here.",
          ...(description.trim() && { description: description.trim() }),
          ...(imageUrl && { imageUrl }),
          price: priceNumber && priceNumber > 0 ? priceNumber : 0,
          ...(discountNumber && discountNumber > 0 && { discountPrice: discountNumber }),
          ...(discountEndsAt && { discountEndsAt }),
          isAvailable,
          isFeatured,
          sortOrder: 0,
          isArchived,
        },
        category ?? { id: categoryId, name: newCategory.trim() || "Category", sortOrder: 0 },
        today,
      ),
    [
      name,
      categoryId,
      shortDescription,
      description,
      imageUrl,
      priceNumber,
      discountNumber,
      discountEndsAt,
      isAvailable,
      isFeatured,
      isArchived,
      category,
      newCategory,
      today,
    ],
  );

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setErrors((e) => ({ ...e, imageUrl: "" }));
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((e) => ({ ...e, imageUrl: "Use a JPG, PNG or WebP image." }));
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setErrors((e) => ({ ...e, imageUrl: "The image must be 5 MB or smaller." }));
      return;
    }
    setUploading(true);
    try {
      setImageUrl((await uploadImage(file)).url);
    } catch (e) {
      setErrors((prev) => ({ ...prev, imageUrl: apiErrorMessage(e) }));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    else if (name.trim().length > 60) next.name = "Name is 60 characters at most.";
    if (categoryId === NEW_CATEGORY && !newCategory.trim()) next.category = "Name the new category.";
    if (!shortDescription.trim()) next.shortDescription = "Short description is required.";
    else if (shortDescription.trim().length > 120)
      next.shortDescription = "Short description is 120 characters at most.";
    if (priceNumber === undefined || !(priceNumber > 0)) next.price = "Price must be more than 0.";
    if (discountPrice.trim() !== "") {
      if (!(discountNumber && discountNumber > 0)) next.discountPrice = "Discount must be more than 0.";
      else if (priceNumber !== undefined && discountNumber >= priceNumber)
        next.discountPrice = "Discount must be lower than the price.";
    }
    if (discountEndsAt && discountPrice.trim() === "") next.discountEndsAt = "Add a discount price first.";
    else if (discountEndsAt && discountEndsAt !== product?.discountEndsAt && discountEndsAt < today) {
      next.discountEndsAt = "The end date must be today or later.";
    }
    return next;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      let targetCategory = categoryId;
      if (categoryId === NEW_CATEGORY) {
        const created = await createCategory({ name: newCategory.trim() });
        onCategoryCreated(created);
        targetCategory = created.id;
      }
      const base = {
        name: name.trim(),
        categoryId: targetCategory,
        shortDescription: shortDescription.trim(),
        price: priceNumber as number,
        isAvailable,
        isFeatured,
        isArchived,
      };
      let saved: Product;
      if (product) {
        const changes: UpdateProductInput = {
          ...base,
          description: description.trim() || null,
          imageUrl: imageUrl || null,
          discountPrice: discountNumber ?? null,
          discountEndsAt: discountEndsAt || null,
        };
        saved = await updateProduct(product.id, changes);
      } else {
        const sameCategory = products.filter((p) => p.categoryId === targetCategory);
        const input: CreateProductInput = {
          ...base,
          sortOrder: sameCategory.length === 0 ? 0 : Math.max(...sameCategory.map((p) => p.sortOrder)) + 1,
          ...(description.trim() && { description: description.trim() }),
          ...(imageUrl && { imageUrl }),
          ...(discountNumber !== undefined && { discountPrice: discountNumber }),
          ...(discountEndsAt && { discountEndsAt }),
        };
        saved = await createProduct(input);
      }
      onSaved(saved);
      onClose();
    } catch (e) {
      setFormError(apiErrorMessage(e));
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-32px)] gap-5 overflow-y-auto overscroll-contain rounded-sheet border border-input bg-surface-2 p-5 text-base text-foreground ring-0 sm:max-w-4xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-section font-bold">
            {product ? "Edit product" : "Add product"}
          </DialogTitle>
          <DialogDescription>The card on the right is how it looks on the menu.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="grid gap-6 min-[761px]:grid-cols-[1fr_300px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className={FIELD}>
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-label-sm text-destructive">{errors.name}</p>}
            </div>

            <div className={FIELD}>
              <Label htmlFor="p-category">Category</Label>
              <NativeSelect id="p-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={NEW_CATEGORY}>+ Add category…</option>
              </NativeSelect>
              {categoryId === NEW_CATEGORY && (
                <Input
                  aria-label="New category name"
                  placeholder="New category name"
                  maxLength={60}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              )}
              {errors.category && <p className="text-label-sm text-destructive">{errors.category}</p>}
            </div>

            <div className={FIELD}>
              <Label htmlFor="p-short">Short description</Label>
              <Input
                id="p-short"
                value={shortDescription}
                maxLength={120}
                onChange={(e) => setShortDescription(e.target.value)}
                aria-invalid={!!errors.shortDescription}
              />
              <p className={cn(HINT, "tabular text-right")}>{shortDescription.length} / 120</p>
              {errors.shortDescription && <p className="text-label-sm text-destructive">{errors.shortDescription}</p>}
            </div>

            <div className={FIELD}>
              <Label htmlFor="p-desc">Full description (optional)</Label>
              <Textarea
                id="p-desc"
                rows={4}
                value={description}
                maxLength={2000}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className={FIELD}>
                <Label htmlFor="p-price">Price (₱)</Label>
                <Input
                  id="p-price"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-invalid={!!errors.price}
                />
                {errors.price && <p className="text-label-sm text-destructive">{errors.price}</p>}
              </div>
              <div className={FIELD}>
                <Label htmlFor="p-discount">Discount price (₱)</Label>
                <Input
                  id="p-discount"
                  inputMode="decimal"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  aria-invalid={!!errors.discountPrice}
                />
                {errors.discountPrice && <p className="text-label-sm text-destructive">{errors.discountPrice}</p>}
              </div>
              <div className={FIELD}>
                <Label htmlFor="p-ends">Discount ends</Label>
                <Input
                  id="p-ends"
                  type="date"
                  value={discountEndsAt}
                  onChange={(e) => setDiscountEndsAt(e.target.value)}
                  aria-invalid={!!errors.discountEndsAt}
                />
                {errors.discountEndsAt && <p className="text-label-sm text-destructive">{errors.discountEndsAt}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6">
              <Switch label="Available" checked={isAvailable} onCheckedChange={setIsAvailable} />
              <Switch label="Featured (Today’s picks)" checked={isFeatured} onCheckedChange={setIsFeatured} />
              <Switch label="Archived (hidden)" checked={isArchived} onCheckedChange={setIsArchived} />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <div className={FIELD}>
              <span className="text-label font-medium">Image</span>
              <div
                className={cn(
                  buttonVariants({ variant: "product", size: "card" }),
                  "pointer-events-none h-auto cursor-default hover:translate-y-0",
                  !isAvailable && "opacity-60",
                )}
                aria-hidden="true"
              >
                <ProductCardContent product={preview} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  id="p-image"
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
                </Button>
                {imageUrl && (
                  <Button type="button" variant="ghost" size="lg" onClick={() => setImageUrl("")}>
                    Remove
                  </Button>
                )}
              </div>
              <p className={HINT}>JPG, PNG or WebP, up to 5 MB. Shown at 4:3.</p>
              {errors.imageUrl && <p className="text-label-sm text-destructive">{errors.imageUrl}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-3 min-[761px]:col-span-2">
            {formError && (
              <p role="alert" className="text-label text-destructive">
                {formError}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" size="lg" disabled={saving} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={saving || uploading}>
                {saving ? "Saving…" : product ? "Save changes" : "Add product"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
