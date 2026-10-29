import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

/** Upload a Buffer or base64 string to Cloudinary, preserving original image bytes */
export async function uploadImage(
  source: Buffer | string,
  folder: string,
  options: { public_id?: string; resource_type?: 'image'; mimeType?: string } = {}
): Promise<{ url: string; public_id: string }> {
  let dataUri: string;
  if (typeof source === 'string') {
    dataUri = source;
  } else {
    // Detect PNG header from buffer bytes (0x89 0x50 0x4E 0x47)
    const isPng = source.length >= 4 && source[0] === 0x89 && source[1] === 0x50 && source[2] === 0x4e && source[3] === 0x47;
    const mime = options.mimeType || (isPng ? 'image/png' : 'image/jpeg');
    dataUri = `data:${mime};base64,${source.toString('base64')}`;
  }

  const { mimeType: _unusedMime, ...uploadOpts } = options;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    ...uploadOpts,
  });

  return { url: result.secure_url, public_id: result.public_id };
}

/** Delete an image from Cloudinary by its public_id */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
