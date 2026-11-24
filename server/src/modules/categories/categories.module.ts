import type { Router } from "express";

import { CategoriesRouter } from "./categories.routes";
import { CategoriesService } from "./categories.service";
import { CategoriesController } from "./categories.controller";
import { type CategoriesRepository, PrismaCategoriesRepository } from "./categories.repository";

interface CategoriesModuleDependencies {
  repository?: CategoriesRepository;
}

export class CategoriesModule {
  readonly service: CategoriesService;
  readonly router: Router;

  constructor({ repository = new PrismaCategoriesRepository() }: CategoriesModuleDependencies = {}) {
    this.service = new CategoriesService(repository);
    this.router = new CategoriesRouter(new CategoriesController(this.service)).router;
  }
}
