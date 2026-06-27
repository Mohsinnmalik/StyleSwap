import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import { Shop } from '@/models/Shop';
import { uploadImage } from '@/lib/cloudinary';

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = (session.user as { shopId?: string })?.shopId;
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) return NextResponse.json({ error: 'No shop found' }, { status: 400 });

  try {
    const formData   = await request.formData();
    const name        = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const logoFile    = formData.get('logo') as File | null;

    await connectDB();
    const shop = await Shop.findById(new mongoose.Types.ObjectId(shopId));
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    if (name) shop.name = name;
    shop.description = description;

    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const { url } = await uploadImage(buffer, 'logos', { public_id: `shop_${shopId}_logo` });
      shop.logo_url = url;
    }

    await shop.save();
    return NextResponse.json({ shop });
  } catch (err) {
    console.error('[shop PUT]', err);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}
