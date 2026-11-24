import type { Router } from "express";

import { AuthRouter } from "./auth.routes";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { type AuthRepository, PrismaAuthRepository } from "./auth.repository";

interface AuthModuleDependencies {
  repository?: AuthRepository;
}

export class AuthModule {
  readonly service: AuthService;
  readonly router: Router;

  constructor({ repository = new PrismaAuthRepository() }: AuthModuleDependencies = {}) {
    this.service = new AuthService(repository);
    this.router = new AuthRouter(new AuthController(this.service)).router;
  }
}
