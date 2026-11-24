/** `POST /media/images` (multipart field `image`): the stored image. Use `url` as a product's `imageUrl` or the hero image. */
export interface UploadedImage {
  /** HTTPS Cloudinary URL. */
  url: string;
  publicId: string;
  width: number;
  height: number;
}
