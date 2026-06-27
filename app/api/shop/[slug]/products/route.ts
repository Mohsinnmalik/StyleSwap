import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import { Product, IProduct } from '@/models/Product';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  await connectDB();
  const shop = await Shop.findOne({ slug: params.slug, is_active: true }).lean() as unknown as IShop | null;
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const query: Record<string, unknown> = { shop_id: shop._id, is_active: true };
  if (category && category !== 'all') query.category = category;

  const products = await Product.find(query).sort({ created_at: -1 }).lean() as unknown as IProduct[];
  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      _id:        p._id.toString(),
      shop_id:    p.shop_id.toString(),
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    })),
  });
}
