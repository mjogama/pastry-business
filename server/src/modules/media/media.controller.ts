import type { Request, Response } from "express";

import type { MediaService } from "./media.service";
import { sendSuccess } from "@shared/http/response";

export class MediaController {
  constructor(private readonly service: MediaService) {}

  uploadImage = async (req: Request, res: Response) => {
    const image = await this.service.uploadImage(req.file);
    sendSuccess(res, { statusCode: 201, message: "Image uploaded", data: image });
  };
}
