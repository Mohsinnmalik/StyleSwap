import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import { Product, IProduct } from '@/models/Product';
import CatalogueClient from '@/components/catalogue/CatalogueClient';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connectDB();
  const shop = await Shop.findOne({ slug: params.slug, is_active: true }).lean() as unknown as IShop | null;
  return { title: shop ? `${shop.name} — Virtual Try-On` : 'Shop' };
}

export default async function ShopCataloguePage({ params }: Props) {
  await connectDB();
  const shop = await Shop.findOne({ slug: params.slug, is_active: true }).lean() as unknown as IShop | null;
  if (!shop) notFound();

  const products = await Product.find({ shop_id: shop._id, is_active: true })
    .sort({ created_at: -1 })
    .lean() as unknown as IProduct[];

  const serializedShop = {
    _id:         shop._id.toString(),
    name:        shop.name,
    slug:        shop.slug,
    description: shop.description,
    logo_url:    shop.logo_url,
  };

  const serializedProducts = products.map((p) => ({
    _id:      p._id.toString(),
    name:     p.name,
    category: p.category,
    price:    p.price,
    images:   p.images,
    sizes:    p.sizes,
  }));

  return <CatalogueClient shop={serializedShop} initialProducts={serializedProducts} />;
}
