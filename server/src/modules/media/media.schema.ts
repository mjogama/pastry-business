export type { UploadedImage } from "@common/modules/media";

export const IMAGE_FIELD = "image";
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** The file as multer hands it over (kept in memory, never written to disk). */
export interface ImageFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}
