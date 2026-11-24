import { v2 as cloudinary } from "cloudinary";

import { env } from "@app/config/env";
import { AppError } from "@shared/errors/AppError";
import type { UploadedImage } from "./media.schema";

export interface MediaRepository {
  /** Stores an image and returns where it can be shown from. */
  upload(image: Buffer): Promise<UploadedImage>;
}

/** Uploads to Cloudinary. Without credentials in the env, uploads answer 503 and the rest of the API still works. */
export class CloudinaryMediaRepository implements MediaRepository {
  private configured = false;

  private configure() {
    const { CLOUDINARY_CLOUD_NAME: cloud_name, CLOUDINARY_API_KEY: api_key, CLOUDINARY_API_SECRET: api_secret } = env;
    if (!cloud_name || !api_key || !api_secret) throw new AppError("Image uploads are not set up", 503);
    if (!this.configured) {
      cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
      this.configured = true;
    }
  }

  upload(image: Buffer): Promise<UploadedImage> {
    this.configure();
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: env.CLOUDINARY_FOLDER,
            resource_type: "image",
            allowed_formats: ["jpg", "png", "webp"],
            // Keep stored originals reasonable; the browser gets resized copies from next/image.
            transformation: [{ width: 2400, height: 2400, crop: "limit" }],
          },
          (error, result) => {
            if (error || !result) {
              reject(new AppError("The image could not be uploaded", 502, error?.message));
              return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height });
          },
        )
        .end(image);
    });
  }
}
