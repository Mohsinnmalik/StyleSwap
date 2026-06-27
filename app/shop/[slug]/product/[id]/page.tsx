import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import { Product, IProduct } from '@/models/Product';
import ProductDetailClient from '@/components/catalogue/ProductDetailClient';
import type { Metadata } from 'next';

interface Props { params: { slug: string; id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!mongoose.Types.ObjectId.isValid(params.id)) return { title: 'Product Not Found' };
  await connectDB();
  const product = await Product.findById(params.id).lean() as unknown as IProduct | null;
  return { title: product?.name ?? 'Product' };
}

export default async function ProductDetailPage({ params }: Props) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();
  await connectDB();
  const shop    = await Shop.findOne({ slug: params.slug, is_active: true }).lean() as unknown as IShop | null;
  if (!shop) notFound();
  const product = await Product.findOne({ _id: params.id, shop_id: shop._id, is_active: true }).lean() as unknown as IProduct | null;
  if (!product) notFound();

  const data = {
    shop:    { slug: shop.slug, name: shop.name },
    product: {
      _id:         product._id.toString(),
      name:        product.name,
      description: product.description,
      category:    product.category,
      price:       product.price,
      images:      product.images,
      sizes:       product.sizes,
      colors:      product.colors,
    },
  };

  return <ProductDetailClient {...data} />;
}
