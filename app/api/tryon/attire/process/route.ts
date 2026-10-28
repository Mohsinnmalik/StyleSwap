import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import { TryonSession, IAttireCloth } from '@/models/TryonSession';
import { uploadImage } from '@/lib/cloudinary';
import { checkRateLimit, getClientIp, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/rate-limit';
import { generateAttireImage } from '@/lib/vertex-ai';

export const maxDuration = 60; // Up to 60 seconds on Vercel for Gemini image generation

function validateFile(file: File): string | null {
  if (file.size === 0) return 'File is empty.';
  if (!ALLOWED_MIME_TYPES.has(file.type)) return 'Invalid file type. Use JPG, PNG or WebP.';
  if (file.size > MAX_FILE_SIZE) return 'File too large. Max 5MB per image.';
  return null;
}

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
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip);
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
  }

  const shopId = formData.get('shop_id') as string;
  const personImageFile = formData.get('person_image');
  const existingPersonUrl = formData.get('person_image_url') as string | null;
  const clothesJson = formData.get('attire_clothes') as string;
  const inferredAttire = (formData.get('inferred_attire') as string) || 'Custom Attire';

  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
    return NextResponse.json({ error: 'A valid shop_id is required.' }, { status: 400 });
  }

  let clothes: IAttireCloth[] = [];
  try {
    clothes = JSON.parse(clothesJson || '[]');
  } catch {
    return NextResponse.json({ error: 'Invalid clothes payload.' }, { status: 400 });
  }

  if (!Array.isArray(clothes) || clothes.length === 0) {
    return NextResponse.json({ error: 'At least one cloth selection is required.' }, { status: 400 });
  }

  try {
    await connectDB();
    const shop = (await Shop.findById(shopId).lean()) as unknown as IShop | null;
    if (!shop) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });

    let personUrl = existingPersonUrl || '';
    let personPubId = 'existing';

    if (personImageFile instanceof File) {
      const err = validateFile(personImageFile);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const personBuf = Buffer.from(await personImageFile.arrayBuffer());
      const date = new Date().toISOString().slice(0, 10);
      const uploaded = await uploadImage(personBuf, `tryon-sessions/${date}`);
      personUrl = uploaded.url;
      personPubId = uploaded.public_id;
    } else if (!personUrl) {
      return NextResponse.json({ error: 'Person photo is required.' }, { status: 400 });
    }

    const code = await generateUniqueCode();

    // Set cloth_source.type to 'catalogue' or 'upload' to match schema enum reliably
    const sourceType = clothes[0]?.product_id ? 'catalogue' : 'upload';

    await TryonSession.create({
      session_code: code,
      shop_id: new mongoose.Types.ObjectId(shopId),
      person_image: { url: personUrl, public_id: personPubId },
      cloth_source: {
        type: sourceType,
        image_url: clothes[0].image_url,
        product_id: clothes[0].product_id ? new mongoose.Types.ObjectId(clothes[0].product_id) : undefined,
      },
      attire_clothes: clothes,
      inferred_attire: inferredAttire,
      status: 'processing',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    waitUntil(
      generateAttireImage(code, personUrl, clothes, inferredAttire).catch((err) =>
        console.error(`[attire/process] AI background generation failed for session ${code}:`, err)
      )
    );

    return NextResponse.json({ success: true, code }, { status: 200 });
  } catch (err: any) {
    console.error('[attire/process] Error:', err.message || err);
    return NextResponse.json({ error: 'Attire processing failed. Try again.' }, { status: 500 });
  }
}
