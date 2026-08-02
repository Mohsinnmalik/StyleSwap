import { auth } from '@/auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import ShopSettingsClient from '@/components/dashboard/ShopSettingsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Shop Settings' };

export default async function ShopSettingsPage() {
  const session = await auth();
  const shopId  = (session?.user as { shopId?: string })?.shopId ?? '';

  let shop = null;
  if (shopId && mongoose.Types.ObjectId.isValid(shopId)) {
    await connectDB();
    shop = await Shop.findById(shopId).lean() as unknown as IShop | null;
  }

  const serialized = shop
    ? { ...shop, _id: shop._id.toString(), owner_id: shop.owner_id.toString(), created_at: shop.created_at.toISOString() }
    : null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in relative z-10 p-0 md:p-8">
      <div className="flex flex-col items-center text-center mb-16 border-b-[3px] border-white pb-8">
        <h1 className="font-mono text-5xl md:text-6xl font-black text-white uppercase tracking-tight mb-4">ATELIER CONFIG</h1>
        <p className="text-sm font-mono font-bold tracking-widest uppercase text-white/70 bg-white/10 px-4 py-2 border-[3px] border-white/30">MANAGE DETAILS & EXPORT QR</p>
      </div>
      <ShopSettingsClient key={serialized?._id ?? 'empty'} shop={serialized} />
    </div>
  );
}
