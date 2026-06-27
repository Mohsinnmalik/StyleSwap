import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  await connectDB();
  const shop = await Shop.findOne({ slug: params.slug, is_active: true }).lean() as unknown as IShop | null;
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  return NextResponse.json({ shop: { ...shop, _id: shop._id.toString(), owner_id: shop.owner_id.toString() } });
}
