import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import { Product, IProduct } from '@/models/Product';
import { TryonSession } from '@/models/TryonSession';
import { uploadImage } from '@/lib/cloudinary';

import { checkRateLimit, getClientIp, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/rate-limit';
import { generateTryOnImage } from '@/lib/vertex-ai';

function validateFile(file: File): string | null {
  if (file.size === 0)                    return 'File is empty.';
  if (!ALLOWED_MIME_TYPES.has(file.type)) return 'Invalid file type. Use JPG, PNG or WebP.';
  if (file.size > MAX_FILE_SIZE)           return 'File too large. Max 5MB per image.';
  return null;
}

/** Generate a unique 6-digit numeric session code, checking for collisions */
async function generateUniqueCode(): Promise<string> {
  await connectDB();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await TryonSession.exists({ session_code: code });
    if (!exists) return code;
  }
  throw new Error('Failed to generate unique session code after 10 attempts');
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 }); }

  const shopId       = formData.get('shop_id') as string;
  const productId    = formData.get('product_id') as string | null;
  const personImage  = formData.get('person_image');
  const clothImageF  = formData.get('cloth_image');

  if (!shopId) return NextResponse.json({ error: 'shop_id is required.' }, { status: 400 });
  if (!(personImage instanceof File)) return NextResponse.json({ error: 'Both images are required.' }, { status: 400 });
  if (!productId && !(clothImageF instanceof File)) return NextResponse.json({ error: 'Both images are required.' }, { status: 400 });

  const personErr = validateFile(personImage);
  if (personErr) return NextResponse.json({ error: personErr }, { status: 400 });

  if (clothImageF instanceof File) {
    const clothErr = validateFile(clothImageF);
    if (clothErr) return NextResponse.json({ error: clothErr }, { status: 400 });
  }

  try {
    await connectDB();

    // Verify shop exists
    const shop = await Shop.findById(shopId).lean() as unknown as IShop | null;
    if (!shop) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });

    // Upload person image to Cloudinary
    const personBuf = Buffer.from(await personImage.arrayBuffer());
    const date      = new Date().toISOString().slice(0, 10);
    const { url: personUrl, public_id: personPubId } = await uploadImage(personBuf, `tryon-sessions/${date}`);

    // Determine cloth image URL
    let clothImageUrl: string;
    let clothPublicId: string | null = null;

    if (productId) {
      // Use product primary image
      const product = await Product.findById(productId).lean() as unknown as IProduct | null;
      if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      clothImageUrl = product.images.find((i) => i.is_primary)?.url ?? product.images[0]?.url ?? '';
    } else {
      // Upload own cloth image
      const clothBuf = Buffer.from(await (clothImageF as File).arrayBuffer());
      const { url, public_id } = await uploadImage(clothBuf, `tryon-sessions/${date}`);
      clothImageUrl = url;
      clothPublicId = public_id;
    }

    // Generate unique 6-digit code
    const code = await generateUniqueCode();

    // Create session record
    await TryonSession.create({
      session_code:  code,
      shop_id:       new mongoose.Types.ObjectId(shopId),
      person_image:  { url: personUrl, public_id: personPubId },
      cloth_source: {
        type:       productId ? 'catalogue' : 'upload',
        product_id: productId ? new mongoose.Types.ObjectId(productId) : undefined,
        image_url:  clothImageUrl,
        public_id:  clothPublicId ?? undefined,
      },
      status:     'processing',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Return code immediately — fire-and-forget background generation
    // In production on Vercel, use waitUntil() from @vercel/functions
    generateTryOnImage(code, personUrl, clothImageUrl).catch((err) =>
      console.error(`[tryon] Vertex AI Background generation failed for ${code}:`, err)
    );

    return NextResponse.json({ success: true, code }, { status: 200 });
  } catch (err) {
    console.error('[tryon/process]', err);
    return NextResponse.json({ error: 'Processing failed. Try again.' }, { status: 500 });
  }
}
