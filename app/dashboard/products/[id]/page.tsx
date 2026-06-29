import { auth } from '@/auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/dashboard/ProductForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit Product' };

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const shopId  = (session?.user as { shopId?: string })?.shopId ?? '';

  if (!mongoose.Types.ObjectId.isValid(params.id) || !shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
    notFound();
  }

  await connectDB();
  const product = await Product.findOne({ _id: params.id, shop_id: shopId }).lean() as any;
  if (!product) notFound();

  const serialized = {
    ...product,
    // @ts-ignore
    _id:        product._id.toString(),
    // @ts-ignore
    shop_id:    product.shop_id.toString(),
    created_at: product.created_at.toISOString(),
    updated_at: product.updated_at.toISOString(),
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Edit Product</h1>
        <p className="text-styleswap-muted text-sm mt-1">{product.name}</p>
      </div>
      <ProductForm mode="edit" product={serialized} />
    </div>
  );
}
