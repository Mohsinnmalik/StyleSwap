import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import { Product, IProduct } from '@/models/Product';
import { uploadImage } from '@/lib/cloudinary';

// ─── GET /api/dashboard/products ─────────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = (session.user as { shopId?: string })?.shopId;
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
    return NextResponse.json({ error: 'No shop found' }, { status: 400 });
  }

  await connectDB();
  const products = await Product.find({ shop_id: new mongoose.Types.ObjectId(shopId) })
    .sort({ created_at: -1 })
    .lean() as unknown as IProduct[];

  return NextResponse.json({ products });
}

// ─── POST /api/dashboard/products ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = (session.user as { shopId?: string })?.shopId;
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
    return NextResponse.json({ error: 'No shop found' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const name        = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const category    = formData.get('category') as string;
    const price       = Number(formData.get('price'));
    const sizes       = JSON.parse(formData.get('sizes') as string || '[]') as string[];
    const colors      = JSON.parse(formData.get('colors') as string || '[]') as string[];
    const primaryIdx  = Number(formData.get('primaryIndex') ?? 0);

    if (!name || !category || isNaN(price)) {
      return NextResponse.json({ error: 'Name, category, and price are required' }, { status: 400 });
    }

    // Upload images to Cloudinary
    const imageFiles = (formData.getAll('images') as File[]).filter(
      (file) => file instanceof File && file.size > 0
    );
    const uploadedImages = await Promise.all(
      imageFiles.map(async (file, idx) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url, public_id } = await uploadImage(buffer, 'products');
        return { url, public_id, is_primary: idx === primaryIdx };
      })
    );

    await connectDB();
    const product = await Product.create({
      shop_id:     new mongoose.Types.ObjectId(shopId),
      name,
      description,
      category,
      price,
      sizes,
      colors,
      images:      uploadedImages,
      is_active:   true,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error('[products POST]', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
