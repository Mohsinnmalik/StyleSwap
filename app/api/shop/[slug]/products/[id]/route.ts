import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import { Product, IProduct } from '@/models/Product';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  await connectDB();
  const shop = await Shop.findOne({ slug: params.slug, is_active: true }).lean() as unknown as IShop | null;
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const product = await Product.findOne({ _id: params.id, shop_id: shop._id, is_active: true }).lean() as unknown as IProduct | null;
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json({
    product: {
      ...product,
      _id:        product._id.toString(),
      shop_id:    product.shop_id.toString(),
      created_at: product.created_at.toISOString(),
      updated_at: product.updated_at.toISOString(),
    },
  });
}
