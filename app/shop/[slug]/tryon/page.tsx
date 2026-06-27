import { Suspense } from 'react';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import { Product, IProduct } from '@/models/Product';
import { notFound } from 'next/navigation';
import TryOnClient from '@/components/tryon/TryOnClient';

interface Props { params: { slug: string }; searchParams?: { product?: string } }

export default async function TryOnPage({ params, searchParams }: Props) {
  await connectDB();
  const shop = await Shop.findOne({ slug: params.slug, is_active: true }).lean() as unknown as IShop | null;
  if (!shop) notFound();

  let preselectedProduct = null;
  if (searchParams?.product && mongoose.Types.ObjectId.isValid(searchParams.product)) {
    const p = await Product.findOne({ _id: searchParams.product, shop_id: shop._id, is_active: true }).lean() as unknown as IProduct | null;
    if (p) {
      preselectedProduct = {
        _id:    p._id.toString(),
        name:   p.name,
        images: p.images,
      };
    }
  }

  return (
    <TryOnClient
      shopSlug={params.slug}
      shopId={shop._id.toString()}
      preselectedProduct={preselectedProduct}
    />
  );
}
