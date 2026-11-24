import type { Router } from "express";

import { ProductsRouter } from "./products.routes";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { type ProductsRepository, PrismaProductsRepository } from "./products.repository";
import { PrismaCategoriesRepository, type CategoriesRepository } from "../categories/categories.repository";

interface ProductsModuleDependencies {
  repository?: ProductsRepository;
  categories?: CategoriesRepository;
}

export class ProductsModule {
  readonly service: ProductsService;
  readonly router: Router;

  constructor({
    repository = new PrismaProductsRepository(),
    categories = new PrismaCategoriesRepository(),
  }: ProductsModuleDependencies = {}) {
    this.service = new ProductsService(repository, categories);
    this.router = new ProductsRouter(new ProductsController(this.service)).router;
  }
}
