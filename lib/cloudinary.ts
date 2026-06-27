import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

/** Upload a Buffer or base64 string to Cloudinary */
export async function uploadImage(
  source: Buffer | string,
  folder: string,
  options: { public_id?: string; resource_type?: 'image' } = {}
): Promise<{ url: string; public_id: string }> {
  const dataUri =
    typeof source === 'string'
      ? source
      : `data:image/jpeg;base64,${source.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    ...options,
  });

  return { url: result.secure_url, public_id: result.public_id };
}

/** Delete an image from Cloudinary by its public_id */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
