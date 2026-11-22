import type { Router } from "express";

import { RecipesRouter } from "./recipes.routes";
import { RecipesService } from "./recipes.service";
import { RecipesController } from "./recipes.controller";
import { type RecipesRepository, PrismaRecipesRepository } from "./recipes.repository";

interface RecipesModuleDependencies {
  repository?: RecipesRepository;
}

export class RecipesModule {
  readonly service: RecipesService;
  readonly router: Router;

  constructor({ repository = new PrismaRecipesRepository() }: RecipesModuleDependencies = {}) {
    this.service = new RecipesService(repository);
    this.router = new RecipesRouter(new RecipesController(this.service)).router;
  }
}
