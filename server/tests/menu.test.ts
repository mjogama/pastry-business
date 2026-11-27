import { randomUUID } from "node:crypto";
import { createApp } from "@app/app";
import { MediaService } from "@modules/media/media.service";
import { DEFAULT_SETTINGS, MenuService } from "@modules/menu/menu.service";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { authCookie } from "./helpers";

const app = createApp();
const cookie = authCookie();

describe("menu, products and categories routes", () => {
  it("rejects invalid params and query", async () => {
    await request(app).get("/api/v1/products/not-a-uuid").expect(400);
    await request(app).get("/api/v1/products?limit=0").expect(400);
    await request(app).get("/api/v1/products?includeArchived=maybe").expect(400);
    await request(app).get("/api/v1/categories/not-a-uuid").expect(400);
  });

  it("needs a session for every write", async () => {
    await request(app).post("/api/v1/products").send({}).expect(401);
    await request(app).patch(`/api/v1/products/${randomUUID()}`).send({}).expect(401);
    await request(app).delete(`/api/v1/products/${randomUUID()}`).expect(401);
    await request(app).post("/api/v1/categories").send({}).expect(401);
    await request(app).patch(`/api/v1/categories/${randomUUID()}`).send({}).expect(401);
    await request(app).delete(`/api/v1/categories/${randomUUID()}`).expect(401);
    await request(app).put("/api/v1/menu/settings").send({}).expect(401);
    await request(app).put("/api/v1/menu/settings/pre-orders").send({ open: false }).expect(401);
    await request(app).get("/api/v1/pre-orders").expect(401);
    await request(app).patch(`/api/v1/pre-orders/${randomUUID()}/status`).send({}).expect(401);
    await request(app).delete(`/api/v1/pre-orders/${randomUUID()}`).expect(401);
    await request(app).post("/api/v1/media/images").expect(401);
  });

  const product = {
    name: "Ube Croissant",
    categoryId: randomUUID(),
    shortDescription: "Flaky.",
    price: 85,
    isAvailable: true,
    isFeatured: false,
    sortOrder: 0,
    isArchived: false,
  };

  it.each([
    ["name", { name: " " }],
    ["name", { name: "x".repeat(61) }],
    ["categoryId", { categoryId: "nope" }],
    ["shortDescription", { shortDescription: "x".repeat(121) }],
    ["price", { price: 0 }],
    ["price", { price: 1.234 }],
    ["imageUrl", { imageUrl: "https://example.com/a.jpg" }],
    ["imageUrl", { imageUrl: "http://res.cloudinary.com/a.jpg" }],
    ["discountEndsAt", { discountEndsAt: "2026-13-01" }],
    ["discountPrice", { discountPrice: 90 }],
    ["variants", { variants: [{ name: "Small", price: 40, isAvailable: true }] }],
    [
      "variants",
      {
        variants: [
          { name: "Small", price: 40, isAvailable: true },
          { name: "small", price: 50, isAvailable: true },
        ],
      },
    ],
    [
      "variants.0.discountPrice",
      {
        variants: [
          { name: "S", price: 40, discountPrice: 40, isAvailable: true },
          { name: "L", price: 60, isAvailable: true },
        ],
      },
    ],
  ])("rejects a bad product %s with field-level details", async (path, patch) => {
    const res = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ ...product, ...patch });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual([expect.objectContaining({ path })]);
  });

  it("rejects an empty product or category update", async () => {
    await request(app).patch(`/api/v1/products/${randomUUID()}`).set("Cookie", cookie).send({}).expect(400);
    await request(app).patch(`/api/v1/categories/${randomUUID()}`).set("Cookie", cookie).send({}).expect(400);
  });

  it("validates the settings body", async () => {
    const res = await request(app)
      .put("/api/v1/menu/settings")
      .set("Cookie", cookie)
      .send({ businessName: "Pato", tagline: "", contactNumber: "0917" });
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual([expect.objectContaining({ path: "contactNumber" })]);
  });

  it("rejects an upload with no file", async () => {
    await request(app).post("/api/v1/media/images").set("Cookie", cookie).expect(400);
  });
});

describe("MenuService", () => {
  const settings = { businessName: "Pato", tagline: "Hi", contactNumber: "+639170000000" };
  const saved = { ...settings, preOrdersOpen: true };

  it("falls back to default settings and builds the menu from its parts", async () => {
    const service = new MenuService(
      {
        findSettings: async () => null,
        saveSettings: async (s) => ({ ...s, preOrdersOpen: true }),
        savePreOrdersOpen: async (open, defaults) => ({ ...defaults, preOrdersOpen: open }),
      },
      { findAll: async () => [{ id: "c", name: "Breads", sortOrder: 0 }] } as never,
      { findAll: async (q?: { includeArchived?: boolean }) => (q?.includeArchived ? ["archived"] : []) } as never,
    );
    expect(await service.getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(await service.getMenu()).toEqual({
      settings: DEFAULT_SETTINGS,
      categories: [{ id: "c", name: "Breads", sortOrder: 0 }],
      products: [],
    });
    expect(await service.updateSettings(settings)).toEqual(saved);
    expect(await service.updatePreOrdersOpen(false)).toMatchObject({ preOrdersOpen: false });
  });
});

describe("MediaService", () => {
  const stored = { url: "https://res.cloudinary.com/x/a.png", publicId: "a", width: 1, height: 1 };
  const service = new MediaService({ upload: async () => stored });
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);

  it("uploads a real image", async () => {
    expect(await service.uploadImage({ buffer: png, mimetype: "image/png", size: png.length })).toEqual(stored);
  });

  it("rejects a missing, oversized or fake image", async () => {
    await expect(service.uploadImage(undefined)).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      service.uploadImage({ buffer: png, mimetype: "image/png", size: 6 * 1024 * 1024 }),
    ).rejects.toMatchObject({
      statusCode: 400,
    });
    const text = Buffer.from("<svg></svg>");
    await expect(service.uploadImage({ buffer: text, mimetype: "image/png", size: text.length })).rejects.toMatchObject(
      {
        statusCode: 400,
      },
    );
  });
});
