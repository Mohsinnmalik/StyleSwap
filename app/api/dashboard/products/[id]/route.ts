import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import { Product, IProduct } from '@/models/Product';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

// ─── GET /api/dashboard/products/[id] ────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = (session.user as { shopId?: string })?.shopId;
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  await connectDB();
  const product = await Product.findOne({ _id: params.id, shop_id: new mongoose.Types.ObjectId(shopId) }).lean() as unknown as IProduct | null;
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ product });
}

// ─── PUT /api/dashboard/products/[id] ────────────────────────────────────────
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = (session.user as { shopId?: string })?.shopId;
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const formData   = await request.formData();
    const name        = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const category    = formData.get('category') as string;
    const price       = Number(formData.get('price'));
    const sizes       = JSON.parse(formData.get('sizes') as string || '[]') as string[];
    const colors      = JSON.parse(formData.get('colors') as string || '[]') as string[];
    const is_active   = formData.get('is_active') === 'true';
    const primaryIdx  = Number(formData.get('primaryIndex') ?? 0);
    const keepImages  = JSON.parse(formData.get('keepImages') as string || '[]') as Array<{ url: string; public_id: string; is_primary: boolean }>;

    await connectDB();
    const product = await Product.findOne({ _id: params.id, shop_id: new mongoose.Types.ObjectId(shopId) });
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Upload new images
    const newFiles = (formData.getAll('images') as File[]).filter(
      (file) => file instanceof File && file.size > 0
    );
    const newUploads = await Promise.all(
      newFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url, public_id } = await uploadImage(buffer, 'products');
        return { url, public_id, is_primary: false };
      })
    );

    // Find deleted images and clean them up from Cloudinary
    const currentPublicIds = new Set(keepImages.map((img) => img.public_id));
    const deletedImages = (product.images || []).filter((img: any) => !currentPublicIds.has(img.public_id));
    await Promise.allSettled(deletedImages.map((img: any) => deleteImage(img.public_id)));

    const allImages = [...keepImages, ...newUploads].map((img, idx) => ({
      ...img,
      is_primary: idx === primaryIdx,
    }));

    Object.assign(product, { name, description, category, price, sizes, colors, is_active, images: allImages, updated_at: new Date() });
    await product.save();

    return NextResponse.json({ product });
  } catch (err) {
    console.error('[products PUT]', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// ─── DELETE /api/dashboard/products/[id] ─────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = (session.user as { shopId?: string })?.shopId;
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  await connectDB();
  const product = await Product.findOne({ _id: params.id, shop_id: new mongoose.Types.ObjectId(shopId) });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Delete all Cloudinary images
  await Promise.allSettled((product.images || []).map((img: any) => deleteImage(img.public_id)));
  await product.deleteOne();

  return NextResponse.json({ success: true });
}

// ─── PATCH /api/dashboard/products/[id] — toggle active ──────────────────────
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = (session.user as { shopId?: string })?.shopId;
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }
  const { is_active } = await request.json() as { is_active: boolean };

  await connectDB();
  const product = await Product.findOneAndUpdate(
    { _id: params.id, shop_id: new mongoose.Types.ObjectId(shopId) },
    { is_active, updated_at: new Date() },
    { new: true }
  ).lean() as unknown as IProduct | null;

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ product });
}
