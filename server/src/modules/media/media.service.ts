import type { MediaRepository } from "./media.repository";
import { BadRequestError } from "@shared/errors/AppError";
import { IMAGE_MAX_BYTES, type IMAGE_TYPES, type ImageFile, type UploadedImage } from "./media.schema";

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) =>
  bytes.every((byte, i) => buffer[offset + i] === byte);

/** The real format, from the file's first bytes: the declared type comes from the client and can't be trusted. */
const sniff = (buffer: Buffer): (typeof IMAGE_TYPES)[number] | null => {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8))
    return "image/webp";
  return null;
};

export class MediaService {
  constructor(private readonly repository: MediaRepository) {}

  async uploadImage(file: ImageFile | undefined): Promise<UploadedImage> {
    if (!file) throw new BadRequestError('Send the image as multipart form data in the field "image"');
    if (file.size > IMAGE_MAX_BYTES) throw new BadRequestError("The image is larger than 5 MB");
    if (!sniff(file.buffer)) throw new BadRequestError("The image must be a JPG, PNG or WebP file");
    return this.repository.upload(file.buffer);
  }
}
