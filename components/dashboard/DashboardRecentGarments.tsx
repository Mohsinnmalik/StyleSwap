'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface ProductImage { url: string; public_id: string; is_primary: boolean }
interface RecentProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  images: ProductImage[];
}

const glassCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
};

export default function DashboardRecentGarments({ products }: { products: RecentProduct[] }) {
  return (
    <div className="rounded-[2.5rem] overflow-hidden" style={glassCard}>
      {/* Card header */}
      <div
        className="flex items-center justify-between px-8 py-6"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3
            className="text-base font-semibold uppercase tracking-[0.12em] font-serif text-[#fdfbf7]"
          >
            Recent <span className="italic font-serif lowercase">Additions</span>
          </h3>
        </div>
        <Link
          href="/dashboard/products"
          className="text-[10px] font-mono font-medium tracking-[0.20em] uppercase transition-all duration-300 hover:text-white"
          style={{ color: 'rgba(253, 251, 247, 0.45)' }}
        >
          View all →
        </Link>
      </div>

      {/* Product rows */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
          >
            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm font-mono tracking-widest uppercase text-white/50">
            Inventory is empty
          </p>
          <Link
            href="/dashboard/products/new"
            className="px-6 py-3 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-350 bg-white/90 text-black hover:bg-white"
          >
            Add First Garment
          </Link>
        </div>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}>
          {products.map((p) => {
            const img = p.images?.find((i) => i.is_primary)?.url || p.images?.[0]?.url || '';
            return (
              <div
                key={p._id}
                className="flex items-center gap-5 px-8 py-5 transition-all duration-300 group cursor-default hover:bg-[rgba(255,255,255,0.03)]"
                style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}
              >
                {/* Thumbnail — Curvy 3:4 portrait */}
                <div
                  className="w-14 rounded-2xl overflow-hidden flex-shrink-0 relative transition-transform duration-300 group-hover:scale-102"
                  style={{ height: '76px', minHeight: '76px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                >
                  {img ? (
                    <Image src={img} alt={p.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/50 block mb-0.5 font-bold">
                    {p.category}
                  </span>
                  <h4
                    className="text-base font-semibold truncate text-[#fdfbf7] tracking-wide font-serif"
                  >
                    {p.name}
                  </h4>
                  <p className="text-sm font-mono text-white/40 mt-0.5">
                    {formatPrice(p.price)}
                  </p>
                </div>

                {/* Edit arrow */}
                <Link
                  href={`/dashboard/products/${p._id}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 text-white/40 hover:text-white hover:border-white/50 hover:bg-white/10"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.12)' }}
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
