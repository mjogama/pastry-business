import { Router } from "express";

import { sendSuccess } from "@shared/http/response";
import { AuthModule } from "@modules/auth/auth.module";
import { MenuModule } from "@modules/menu/menu.module";
import { MediaModule } from "@modules/media/media.module";
import { RecipesModule } from "@modules/recipes/recipes.module";
import { ProductsModule } from "@modules/products/products.module";
import { PreOrderModule } from "@modules/pre-order/pre-order.module";
import { CategoriesModule } from "@modules/categories/categories.module";
import { SalesEntryModule } from "@modules/sales-entry/sales-entry.module";

const v1Router = Router();

v1Router.get("/status", (_req, res) => {
  sendSuccess(res, { message: "API v1 is running", data: null });
});

v1Router.use("/auth", new AuthModule().router);
v1Router.use("/menu", new MenuModule().router);
v1Router.use("/media", new MediaModule().router);
v1Router.use("/products", new ProductsModule().router);
v1Router.use("/categories", new CategoriesModule().router);
v1Router.use("/recipes", new RecipesModule().router);
v1Router.use("/sales-entries", new SalesEntryModule().router);
v1Router.use("/pre-orders", new PreOrderModule().router);

export default v1Router;
