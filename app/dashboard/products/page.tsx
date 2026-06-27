import Link from 'next/link';
import { auth } from '@/auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import ProductListClient from '@/components/dashboard/ProductListClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage() {
  const session = await auth();
  const shopId  = (session?.user as { shopId?: string })?.shopId ?? '';

  let products: any[] = [];
  if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
    await connectDB();
    products = await Product.find({ shop_id: shopId }).sort({ created_at: -1 }).lean();
  }

  const serialized = products.map((p) => ({
    ...p,
    _id:        p._id.toString(),
    shop_id:    p.shop_id.toString(),
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  }));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-styleswap-muted text-sm mt-1">{products.length} item{products.length !== 1 ? 's' : ''} in catalogue</p>
        </div>
        <Link href="/dashboard/products/new" className="btn-primary !w-auto px-5 py-3 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      <ProductListClient initialProducts={serialized} />
    </div>
  );
}
