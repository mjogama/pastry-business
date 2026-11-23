import type { Router } from "express";

import { SalesEntryRouter } from "./sales-entry.routes";
import { SalesEntryService } from "./sales-entry.service";
import { SalesEntryController } from "./sales-entry.controller";
import { type SalesEntryRepository, PrismaSalesEntryRepository } from "./sales-entry.repository";

interface SalesEntryModuleDependencies {
  repository?: SalesEntryRepository;
}

export class SalesEntryModule {
  readonly service: SalesEntryService;
  readonly router: Router;

  constructor({ repository = new PrismaSalesEntryRepository() }: SalesEntryModuleDependencies = {}) {
    this.service = new SalesEntryService(repository);
    this.router = new SalesEntryRouter(new SalesEntryController(this.service)).router;
  }
}
