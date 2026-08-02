import Link from 'next/link';
import { auth } from '@/auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import ProductListClient from '@/components/dashboard/ProductListClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Couture Catalogue | Tryonity Dashboard' };

export default async function ProductsPage() {
  const session = await auth();
  const shopId  = (session?.user as { shopId?: string })?.shopId ?? '';

  let products: any[] = [];
  if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
    await connectDB();
    products = await Product.find({ shop_id: shopId }).sort({ created_at: -1 }).lean() as any[];
  }

  const serialized = products.map((p) => ({
    ...p,
    _id:        p._id.toString(),
    shop_id:    p.shop_id.toString(),
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString(),
  }));

  return (
    <div className="animate-fade-in w-full space-y-8">

      {/* Page header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/30 mb-2">
            Inventory Management
          </p>
          <h1 className="font-serif text-3xl md:text-4xl uppercase tracking-[0.15em] font-light text-white">
            Catalogue
          </h1>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 mt-1 block">
            {products.length} {products.length !== 1 ? 'garments' : 'garment'}
          </span>
        </div>

        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 px-6 py-3 rounded-full font-sans font-bold text-[10px] tracking-[0.2em] uppercase text-black transition-all duration-300 hover:bg-white flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.88)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Garment
        </Link>
      </div>

      {/* Hairline divider */}
      <div className="w-full h-px" style={{ background: 'rgba(224, 122, 95, 0.14)' }} />

      <ProductListClient initialProducts={serialized} />

    </div>
  );
}
