import { auth } from '@/auth';
import Link from 'next/link';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import { Product, IProduct } from '@/models/Product';
import { TryonSession } from '@/models/TryonSession';

export const metadata = { title: 'Dashboard' };

async function getStats(shopId: string) {
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
    return { totalProducts: 0, activeSessions: 0, tryonsToday: 0 };
  }
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalProducts, activeSessions, tryonsToday] = await Promise.all([
    Product.countDocuments({ shop_id: shopId }),
    TryonSession.countDocuments({ shop_id: shopId, status: 'processing' }),
    TryonSession.countDocuments({ shop_id: shopId, created_at: { $gte: today } }),
  ]);

  return { totalProducts, activeSessions, tryonsToday };
}

async function getShop(shopId: string) {
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) return null;
  await connectDB();
  return Shop.findById(shopId).lean() as unknown as IShop | null;
}

export default async function DashboardPage() {
  const session = await auth();
  const shopId  = (session?.user as { shopId?: string })?.shopId ?? '';

  const [stats, shop] = await Promise.all([
    getStats(shopId),
    getShop(shopId),
  ]);

  const STAT_CARDS = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon:  'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      bg:    'bg-[#3B82F6]',
      href:  '/dashboard/products',
    },
    {
      label: 'Active Sessions',
      value: stats.activeSessions,
      icon:  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      bg:    'bg-[#ffde59]',
      href:  null,
    },
    {
      label: "Try-Ons Today",
      value: stats.tryonsToday,
      icon:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      bg:    'bg-[#00cc00]',
      href:  null,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">
            {shop ? shop.name : 'Dashboard'}
          </h1>
          <p className="text-styleswap-muted text-sm mt-1">Welcome back — here's what's happening</p>
        </div>
        <Link href="/dashboard/products/new" className="btn-primary !w-auto px-5 py-3 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon, bg, href }) => {
          const content = (
            <div className={`card ${bg} p-6 ${href ? 'hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-black font-black uppercase tracking-widest text-sm bg-white border-2 border-black px-2 shadow-neo-sm inline-block">{label}</p>
                <div className={`w-12 h-12 rounded-neo bg-white border-4 border-black flex items-center justify-center shadow-neo-sm`}>
                  <svg className={`w-6 h-6 text-black`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={icon} />
                  </svg>
                </div>
              </div>
              <p className={`text-6xl font-black text-black mt-2 drop-shadow-[2px_2px_0px_#fff]`}>{value}</p>
            </div>
          );
          return href ? <Link key={label} href={href}>{content}</Link> : <div key={label}>{content}</div>;
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/products" className="card-hover bg-white p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#ffde59] border-4 border-black rounded-neo flex items-center justify-center flex-shrink-0 shadow-neo-sm">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-black font-black uppercase text-base tracking-wide">Product Catalogue</p>
            <p className="text-styleswap-subtle text-sm font-bold mt-0.5">Add, edit, and manage your products</p>
          </div>
          <svg className="w-6 h-6 text-black ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/dashboard/shop" className="card-hover bg-white p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-styleswap-accent border-4 border-black rounded-neo flex items-center justify-center flex-shrink-0 shadow-neo-sm">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p className="text-black font-black uppercase text-base tracking-wide">Shop Settings & QR</p>
            <p className="text-styleswap-subtle text-sm font-bold mt-0.5">Edit shop info and download your QR</p>
          </div>
          <svg className="w-6 h-6 text-black ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
