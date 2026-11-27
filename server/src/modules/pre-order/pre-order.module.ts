import type { Router } from "express";

import { PreOrderRouter } from "./pre-order.routes";
import { PreOrderService } from "./pre-order.service";
import { PreOrderController } from "./pre-order.controller";
import { type PreOrderMailer, ResendPreOrderMailer } from "./pre-order.mailer";
import { type MenuRepository, PrismaMenuRepository } from "../menu/menu.repository";
import { type PreOrderRepository, PrismaPreOrderRepository } from "./pre-order.repository";
import { type ProductsRepository, PrismaProductsRepository } from "../products/products.repository";

interface PreOrderModuleDependencies {
  repository?: PreOrderRepository;
  products?: ProductsRepository;
  settings?: MenuRepository;
  mailer?: PreOrderMailer;
}

export class PreOrderModule {
  readonly service: PreOrderService;
  readonly router: Router;

  constructor({
    repository = new PrismaPreOrderRepository(),
    products = new PrismaProductsRepository(),
    settings = new PrismaMenuRepository(),
    mailer = new ResendPreOrderMailer(),
  }: PreOrderModuleDependencies = {}) {
    this.service = new PreOrderService(repository, products, settings, mailer);
    this.router = new PreOrderRouter(new PreOrderController(this.service)).router;
  }
}
