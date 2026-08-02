import React from 'react';
import { auth } from '@/auth';
import Link from 'next/link';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Shop, IShop } from '@/models/Shop';
import { Product, IProduct } from '@/models/Product';
import { TryonSession } from '@/models/TryonSession';
import { formatPrice } from '@/lib/utils';
import DashboardRecentGarments from '@/components/dashboard/DashboardRecentGarments';

export const metadata = { title: 'Atelier Dashboard | Tryonity' };

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

async function getRecentProducts(shopId: string) {
  if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) return [];
  await connectDB();
  return Product.find({ shop_id: shopId, is_active: true })
    .sort({ created_at: -1 })
    .limit(6)
    .lean() as unknown as IProduct[];
}

/* ─── Pinterest Curvy Glass Card Styles (Monochrome) ───────────────────── */
const glassCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
};

/* ─── Stat card component ────────────────────────────────────────────────── */
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-8 rounded-[2.5rem] transition-all duration-300 hover:scale-[1.03] hover:border-white/20 group"
      style={{
        ...glassCard,
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/40 mb-3 font-mono group-hover:text-white/70 transition-colors">
        {label}
      </span>
      <p
        className="text-4xl md:text-5xl font-light font-serif tracking-wide text-white leading-none"
      >
        {value}
      </p>
      {sub && (
        <span className="text-[10px] tracking-widest uppercase text-white/30 mt-2 font-mono">{sub}</span>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const session    = await auth();
  const shopId     = (session?.user as { shopId?: string })?.shopId ?? '';
  const [stats, shop, recentProducts] = await Promise.all([
    getStats(shopId),
    getShop(shopId),
    getRecentProducts(shopId),
  ]);

  return (
    <div className="space-y-12 animate-fade-in w-full pb-8">

      {/* ── Header with Curvy typography ───────────────────────────────── */}
      <div className="flex flex-col items-center text-center space-y-4 pt-4">
        <span
          className="text-[9px] font-mono font-semibold tracking-[0.35em] uppercase px-5 py-2 rounded-full border border-white/25 bg-white/5"
        >
          Atelier Control
        </span>
        <h1
          className="text-4xl md:text-6xl font-light uppercase tracking-[0.12em] text-[#fdfbf7] font-serif leading-tight"
        >
          {shop ? (
            <>
              {shop.name.split(' ')[0]}{' '}
              <span className="italic font-serif lowercase">de</span>{' '}
              <span className="italic font-serif">Couture</span>
            </>
          ) : (
            <>
              Your <span className="italic font-serif">Atelier</span>
            </>
          )}
        </h1>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-white/50">
          Manage your boutique inventory &amp; virtual try‑on showroom
        </p>
        {/* Soft Divider */}
        <div className="w-24 h-px mt-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Catalogue"     value={stats.totalProducts} sub="garments" />
        <StatCard label="Live Sessions" value={stats.activeSessions} sub="active" />
        <StatCard label="Try‑Ons Today" value={stats.tryonsToday} sub="renders" />
        <StatCard label="Kiosk Status"  value="●" sub="Online" />
      </div>

      {/* ── Quick Actions (Landing page CTA styled) ───────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard/products/new"
          className="flex-grow flex items-center justify-center gap-2.5 py-5 rounded-full font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)] active:scale-[0.99] bg-white/90 text-black hover:bg-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Garment
        </Link>

        {shop && (
          <Link
            href={`/shop/${shop.slug}`}
            target="_blank"
            className="flex-grow flex items-center justify-center gap-2.5 py-5 rounded-full font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.01] hover:bg-white/10 active:scale-[0.99] border border-white/30 text-white hover:border-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Showroom
          </Link>
        )}
      </div>

      {/* ── Recent Garments ─────────────────────────────────────────────── */}
      <DashboardRecentGarments
        products={recentProducts.map((p) => ({
          _id:      p._id.toString(),
          name:     p.name,
          category: p.category,
          price:    p.price,
          images:   (p.images ?? []).map((img) => ({
            url:        img.url,
            public_id:  img.public_id,
            is_primary: img.is_primary,
          })),
        }))}
      />

      {/* ── QR Exporter card ────────────────────────────────────────────── */}
      <Link
        href="/dashboard/shop"
        className="flex flex-col sm:flex-row items-center gap-6 p-8 rounded-[2.5rem] w-full text-left transition-all duration-300 hover:scale-[1.02] hover:border-white/20 group"
        style={{
          ...glassCard,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 0 18px rgba(255, 255, 255, 0.05)',
          }}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3
            className="text-xl font-semibold uppercase tracking-[0.12em] text-[#fdfbf7] mb-1 font-serif"
          >
            Atelier <span className="italic font-serif">QR Exporter</span>
          </h3>
          <p className="text-xs font-mono tracking-[0.15em] uppercase text-white/40">
            Generate &amp; download a print‑ready 4K QR code for your showroom display
          </p>
        </div>
        <svg className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1 text-white/30 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

    </div>
  );
}
