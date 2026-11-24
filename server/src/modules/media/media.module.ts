import type { Router } from "express";

import { MediaRouter } from "./media.routes";
import { MediaService } from "./media.service";
import { MediaController } from "./media.controller";
import { type MediaRepository, CloudinaryMediaRepository } from "./media.repository";

interface MediaModuleDependencies {
  repository?: MediaRepository;
}

export class MediaModule {
  readonly service: MediaService;
  readonly router: Router;

  constructor({ repository = new CloudinaryMediaRepository() }: MediaModuleDependencies = {}) {
    this.service = new MediaService(repository);
    this.router = new MediaRouter(new MediaController(this.service)).router;
  }
}
