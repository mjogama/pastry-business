import multer from "multer";
import { type NextFunction, type Request, type Response, Router } from "express";

import type { MediaController } from "./media.controller";
import { BadRequestError } from "@shared/errors/AppError";
import { IMAGE_FIELD, IMAGE_MAX_BYTES } from "./media.schema";
import { requireAuth } from "@shared/middlewares/requireAuth";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: IMAGE_MAX_BYTES, files: 1 } });

/** Reads the single `image` file into memory, turning multer's own errors into 400s. */
const readImage = (req: Request, res: Response, next: NextFunction) =>
  upload.single(IMAGE_FIELD)(req, res, (error: unknown) => {
    if (!error) return next();
    next(
      error instanceof multer.MulterError
        ? new BadRequestError(error.code === "LIMIT_FILE_SIZE" ? "The image is larger than 5 MB" : error.message)
        : error,
    );
  });

export class MediaRouter {
  readonly router: Router = Router();

  constructor(controller: MediaController) {
    this.router.post("/images", requireAuth, readImage, controller.uploadImage);
  }
}
