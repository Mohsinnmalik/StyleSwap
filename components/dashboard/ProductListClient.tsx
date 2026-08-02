'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface ProductImage { url: string; public_id: string; is_primary: boolean }
interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  images: ProductImage[];
  is_active: boolean;
  created_at: string;
}

/* ─── Pinterest Curvy Glass Card Styles (Monochrome) ───────────────────── */
const glassCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
};

export default function ProductListClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [deleting, setDeleting] = useState<string | null>(null);

  const primaryImg = (p: Product) => p.images.find((i) => i.is_primary)?.url ?? p.images[0]?.url ?? '';

  const handleToggle = async (id: string, current: boolean) => {
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, is_active: !current } : p)));
    try {
      const res = await fetch(`/api/dashboard/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, is_active: current } : p)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently remove this garment from the catalogue?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/dashboard/products/${id}`, { method: 'DELETE' });
      if (res.ok) setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch { /* network error */ }
    finally { setDeleting(null); }
  };

  /* ── Empty state ─────────────────────────────────────────────────────── */
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center rounded-[2.5rem]" style={glassCard}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
        >
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <p className="font-serif text-lg uppercase tracking-[0.2em] font-light text-[#fdfbf7] mb-1">
            Inventory Empty
          </p>
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/40">
            No garments in the catalogue yet
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="px-8 py-3 rounded-full font-sans font-bold text-[10px] tracking-[0.2em] uppercase transition-all duration-350 bg-white/90 text-black hover:bg-white"
        >
          Add First Garment
        </Link>
      </div>
    );
  }

  /* ── List ────────────────────────────────────────────────────────────── */
  return (
    <div className="rounded-[2.5rem] overflow-hidden animate-fade-in" style={glassCard}>
      <div className="flex flex-col">
        {products.map((product, idx) => (
          <div
            key={product._id}
            className="flex items-center gap-5 px-6 py-5 transition-colors duration-300 hover:bg-[rgba(255,255,255,0.03)] group"
            style={{ borderBottom: idx !== products.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
          >
            {/* Thumbnail — Curvy 3:4 portrait */}
            <div
              className="w-12 rounded-2xl overflow-hidden flex-shrink-0 relative transition-transform duration-300 group-hover:scale-102"
              style={{
                height: '68px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {primaryImg(product) ? (
                <Image src={primaryImg(product)} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/50 block mb-0.5 font-bold">
                {product.category}
              </span>
              <p className="font-serif text-sm font-light tracking-[0.12em] uppercase truncate text-[#fdfbf7]">
                {product.name}
              </p>
              <p className="font-mono text-[10px] tracking-widest text-white/30 mt-0.5">
                {formatPrice(product.price)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                {/* Edit */}
                <Link
                  href={`/dashboard/products/${product._id}`}
                  title="Edit"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white/40 hover:text-white hover:border-white/50 hover:bg-white/10"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.12)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(product._id)}
                  disabled={deleting === product._id}
                  title="Delete"
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white/40 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-30"
                  style={{ border: '1px solid rgba(255, 255, 255, 0.12)' }}
                >
                  {deleting === product._id ? (
                    <div className="w-3.5 h-3.5 rounded-full border border-t-transparent border-red-500 animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Active / Hidden toggle */}
              <button
                onClick={() => handleToggle(product._id, product.is_active)}
                className="font-mono text-[8px] tracking-[0.2em] uppercase px-3 py-1 rounded-full transition-all duration-300"
                style={
                  product.is_active
                    ? {
                        color: '#000000',
                        background: 'rgba(255, 255, 255, 0.90)',
                        border: '1px solid transparent',
                      }
                    : {
                        color: 'rgba(255, 255, 255, 0.50)',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                      }
                }
              >
                {product.is_active ? '● Live' : '○ Hidden'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
