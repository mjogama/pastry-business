import type { Router } from "express";

import { ExampleRouter } from "./example.routes";
import { ExampleService } from "./example.service";
import { ExampleController } from "./example.controller";
import { type ExampleRepository, InMemoryExampleRepository } from "./example.repository";

interface ExampleModuleDependencies {
  repository?: ExampleRepository;
}

export class ExampleModule {
  readonly service: ExampleService;
  readonly router: Router;

  constructor({ repository = new InMemoryExampleRepository() }: ExampleModuleDependencies = {}) {
    this.service = new ExampleService(repository);
    this.router = new ExampleRouter(new ExampleController(this.service)).router;
  }
}
