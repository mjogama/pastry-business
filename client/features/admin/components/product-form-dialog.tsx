"use client";

import type { CreateProductInput, ProductVariant, UpdateProductInput } from "@common/modules/product";
import { PlusIcon, XIcon } from "lucide-react";
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

/** Matches the server's `MAX_VARIANTS`. */
const MAX_SIZES = 8;
const QUICK_SIZES = ["Small", "Medium", "Large"];

/** A size row as typed; `key` only keeps React rows stable. */
interface SizeDraft {
  key: number;
  name: string;
  price: string;
  discount: string;
  isAvailable: boolean;
}

let nextSizeKey = 0;
const newSize = (name = "", from?: ProductVariant): SizeDraft => ({
  key: nextSizeKey++,
  name: from?.name ?? name,
  price: from ? String(from.price) : "",
  discount: from?.discountPrice != null ? String(from.discountPrice) : "",
  isAvailable: from?.isAvailable ?? true,
});

/** The rows that are filled in well enough to preview or save. */
const toVariants = (sizes: SizeDraft[]): ProductVariant[] =>
  sizes.flatMap((size) => {
    const price = toNumber(size.price);
    const discount = toNumber(size.discount);
    if (!size.name.trim() || !(price && price > 0)) return [];
    return [
      {
        name: size.name.trim(),
        price,
        ...(discount && discount > 0 && discount < price && { discountPrice: discount }),
        isAvailable: size.isAvailable,
      },
    ];
  });

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
  const [sizes, setSizes] = useState<SizeDraft[]>(() => (product?.variants ?? []).map((v) => newSize("", v)));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const category = categories.find((c) => c.id === categoryId);
  const priceNumber = toNumber(price);
  const discountNumber = toNumber(discountPrice);
  const hasSizes = sizes.length > 0;
  const variants = useMemo(() => toVariants(sizes), [sizes]);
  // The sale end date belongs to a discount: the product's, or any size's.
  const hasDiscount = hasSizes ? sizes.some((size) => size.discount.trim() !== "") : discountPrice.trim() !== "";

  const updateSize = (key: number, changes: Partial<SizeDraft>) =>
    setSizes((current) => {
      const next = current.map((size) => (size.key === key ? { ...size, ...changes } : size));
      if (!next.some((size) => size.discount.trim() !== "")) setDiscountEndsAt("");
      return next;
    });
  const removeSize = (key: number) => {
    const next = sizes.filter((size) => size.key !== key);
    if (!next.some((size) => size.discount.trim() !== "")) setDiscountEndsAt("");
    setSizes(next);
  };
  const addSizes = (names: string[]) =>
    setSizes((current) => [...current, ...names.map((name) => newSize(name))].slice(0, MAX_SIZES));
  const missingQuick = QUICK_SIZES.filter(
    (name) => !sizes.some((size) => size.name.trim().toLowerCase() === name.toLowerCase()),
  );

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
          ...(variants.length >= 2 && { variants }),
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
      variants,
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
    if (hasSizes) validateSizes(next);
    else if (priceNumber === undefined || !(priceNumber > 0)) next.price = "Price must be more than 0.";
    if (!hasSizes && discountPrice.trim() !== "") {
      if (!(discountNumber && discountNumber > 0)) next.discountPrice = "Discount must be more than 0.";
      else if (priceNumber !== undefined && discountNumber >= priceNumber)
        next.discountPrice = "Discount must be less than the price.";
    }
    if (discountEndsAt && !hasDiscount) next.discountEndsAt = "Add a discount amount first.";
    else if (discountEndsAt && discountEndsAt !== product?.discountEndsAt && discountEndsAt < today) {
      next.discountEndsAt = "The end date must be today or later.";
    }
    return next;
  }

  function validateSizes(next: Record<string, string>) {
    if (sizes.length === 1) next.sizes = "Add at least two sizes, or remove this one.";
    const seen = new Set<string>();
    for (const size of sizes) {
      const name = size.name.trim();
      const price = toNumber(size.price);
      const discount = toNumber(size.discount);
      if (!name) next[`size-${size.key}-name`] = "Name the size.";
      else if (name.length > 30) next[`size-${size.key}-name`] = "30 characters at most.";
      else if (seen.has(name.toLowerCase())) next[`size-${size.key}-name`] = "Already used.";
      seen.add(name.toLowerCase());
      if (price === undefined || !(price > 0)) next[`size-${size.key}-price`] = "More than 0.";
      if (size.discount.trim() !== "") {
        if (!(discount && discount > 0)) next[`size-${size.key}-discount`] = "More than 0.";
        else if (price !== undefined && discount >= price) next[`size-${size.key}-discount`] = "Less than the price.";
      }
    }
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
      // With sizes, the server works out the price and availability from them; these are its best guess.
      const base = {
        name: name.trim(),
        categoryId: targetCategory,
        shortDescription: shortDescription.trim(),
        price: hasSizes ? Math.min(...variants.map((v) => v.price)) : (priceNumber as number),
        isAvailable: hasSizes ? variants.some((v) => v.isAvailable) : isAvailable,
        isFeatured,
        isArchived,
      };
      let saved: Product;
      if (product) {
        const changes: UpdateProductInput = {
          ...base,
          description: description.trim() || null,
          imageUrl: imageUrl || null,
          discountPrice: hasSizes ? null : (discountNumber ?? null),
          discountEndsAt: discountEndsAt || null,
          variants,
        };
        saved = await updateProduct(product.id, changes);
      } else {
        const sameCategory = products.filter((p) => p.categoryId === targetCategory);
        const input: CreateProductInput = {
          ...base,
          sortOrder: sameCategory.length === 0 ? 0 : Math.max(...sameCategory.map((p) => p.sortOrder)) + 1,
          ...(description.trim() && { description: description.trim() }),
          ...(imageUrl && { imageUrl }),
          ...(!hasSizes && discountNumber !== undefined && { discountPrice: discountNumber }),
          ...(discountEndsAt && { discountEndsAt }),
          ...(hasSizes && { variants }),
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
      <DialogContent className="max-h-[calc(100dvh-32px)] gap-5 overflow-x-hidden overflow-y-auto overscroll-contain rounded-sheet border border-input bg-surface-2 p-5 text-base text-foreground ring-0 sm:max-w-4xl sm:p-6">
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

            <SizesEditor
              sizes={sizes}
              errors={errors}
              missingQuick={missingQuick}
              onAdd={addSizes}
              onChange={updateSize}
              onRemove={removeSize}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              {!hasSizes && (
                <>
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
                    <Label htmlFor="p-discount">Discount amount off (₱)</Label>
                    <Input
                      id="p-discount"
                      inputMode="decimal"
                      value={discountPrice}
                      onChange={(e) => {
                        setDiscountPrice(e.target.value);
                        // The end date belongs to the discount: no price, no date.
                        if (e.target.value.trim() === "") setDiscountEndsAt("");
                      }}
                      aria-invalid={!!errors.discountPrice}
                    />
                    {errors.discountPrice && <p className="text-label-sm text-destructive">{errors.discountPrice}</p>}
                  </div>
                </>
              )}
              <div className={FIELD}>
                <Label htmlFor="p-ends">Discount ends</Label>
                <Input
                  id="p-ends"
                  type="date"
                  value={discountEndsAt}
                  disabled={!hasDiscount}
                  onChange={(e) => setDiscountEndsAt(e.target.value)}
                  aria-invalid={!!errors.discountEndsAt}
                />
                {errors.discountEndsAt && <p className="text-label-sm text-destructive">{errors.discountEndsAt}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6">
              {!hasSizes && <Switch label="Available" checked={isAvailable} onCheckedChange={setIsAvailable} />}
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
                  !preview.isAvailable && "opacity-60",
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

/**
 * Optional sizes: none for a product sold one way, or 2–8 with their own price, discount and
 * availability. Small / Medium / Large add in one tap; any other name can be typed.
 */
function SizesEditor({
  sizes,
  errors,
  missingQuick,
  onAdd,
  onChange,
  onRemove,
}: {
  sizes: SizeDraft[];
  errors: Record<string, string>;
  missingQuick: string[];
  onAdd: (names: string[]) => void;
  onChange: (key: number, changes: Partial<SizeDraft>) => void;
  onRemove: (key: number) => void;
}) {
  const full = sizes.length >= MAX_SIZES;
  const error = (key: number, field: string) => errors[`size-${key}-${field}`];
  return (
    <fieldset className="flex flex-col gap-3 rounded-card border border-border p-4">
      <legend className="px-1 text-label font-medium">Sizes (optional)</legend>
      <p className={HINT}>
        {sizes.length === 0
          ? "For items that come in sizes. Each size gets its own price, discount and stock."
          : "The card shows the lowest price and the sizes in stock. Price and stock are set per size."}
      </p>

      {sizes.map((size, index) => (
        <div
          key={size.key}
          className="grid grid-cols-2 items-start gap-3 border-t border-border pt-3 first-of-type:border-t-0 first-of-type:pt-0 sm:grid-cols-[1fr_6.5rem_6.5rem_auto]"
        >
          <div className={cn(FIELD, "col-span-2 sm:col-span-1")}>
            <Label htmlFor={`size-${size.key}-name`}>Size {index + 1}</Label>
            <Input
              id={`size-${size.key}-name`}
              value={size.name}
              maxLength={30}
              placeholder="e.g. Small"
              onChange={(e) => onChange(size.key, { name: e.target.value })}
              aria-invalid={!!error(size.key, "name")}
            />
            {error(size.key, "name") && <p className="text-label-sm text-destructive">{error(size.key, "name")}</p>}
          </div>
          <div className={FIELD}>
            <Label htmlFor={`size-${size.key}-price`}>Price (₱)</Label>
            <Input
              id={`size-${size.key}-price`}
              inputMode="decimal"
              value={size.price}
              onChange={(e) => onChange(size.key, { price: e.target.value })}
              aria-invalid={!!error(size.key, "price")}
            />
            {error(size.key, "price") && <p className="text-label-sm text-destructive">{error(size.key, "price")}</p>}
          </div>
          <div className={FIELD}>
            <Label htmlFor={`size-${size.key}-discount`}>Off (₱)</Label>
            <Input
              id={`size-${size.key}-discount`}
              inputMode="decimal"
              value={size.discount}
              onChange={(e) => onChange(size.key, { discount: e.target.value })}
              aria-invalid={!!error(size.key, "discount")}
            />
            {error(size.key, "discount") && (
              <p className="text-label-sm text-destructive">{error(size.key, "discount")}</p>
            )}
          </div>
          <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-end sm:gap-0">
            <Switch
              label="Available"
              checked={size.isAvailable}
              onCheckedChange={(isAvailable) => onChange(size.key, { isAvailable })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-touch"
              aria-label={`Remove ${size.name.trim() || `size ${index + 1}`}`}
              onClick={() => onRemove(size.key)}
            >
              <XIcon />
            </Button>
          </div>
        </div>
      ))}

      {errors.sizes && <p className="text-label-sm text-destructive">{errors.sizes}</p>}

      <div className="flex flex-wrap gap-2">
        {sizes.length === 0 ? (
          <Button type="button" variant="outline" size="lg" onClick={() => onAdd(QUICK_SIZES)}>
            <PlusIcon />
            Small, Medium, Large
          </Button>
        ) : (
          missingQuick.map((name) => (
            <Button key={name} type="button" variant="outline" size="lg" disabled={full} onClick={() => onAdd([name])}>
              <PlusIcon />
              {name}
            </Button>
          ))
        )}
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={full}
          onClick={() => onAdd(sizes.length === 0 ? ["", ""] : [""])}
        >
          <PlusIcon />
          {sizes.length === 0 ? "Other sizes" : "Another size"}
        </Button>
      </div>
    </fieldset>
  );
}
