import type { Router } from "express";

import { MenuRouter } from "./menu.routes";
import { MenuService } from "./menu.service";
import { MenuController } from "./menu.controller";
import { type MenuRepository, PrismaMenuRepository } from "./menu.repository";
import { type ProductsRepository, PrismaProductsRepository } from "../products/products.repository";
import { type CategoriesRepository, PrismaCategoriesRepository } from "../categories/categories.repository";

interface MenuModuleDependencies {
  repository?: MenuRepository;
  categories?: CategoriesRepository;
  products?: ProductsRepository;
}

export class MenuModule {
  readonly service: MenuService;
  readonly router: Router;

  constructor({
    repository = new PrismaMenuRepository(),
    categories = new PrismaCategoriesRepository(),
    products = new PrismaProductsRepository(),
  }: MenuModuleDependencies = {}) {
    this.service = new MenuService(repository, categories, products);
    this.router = new MenuRouter(new MenuController(this.service)).router;
  }
}
