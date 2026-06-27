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
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Shop Settings</h1>
        <p className="text-styleswap-muted text-sm mt-1">Manage your shop info and download your customer QR code</p>
      </div>
      <ShopSettingsClient key={serialized?._id ?? 'empty'} shop={serialized} />
    </div>
  );
}
