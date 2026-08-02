'use client';

import { useState } from 'react';
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
  sizes: string[];
}
interface Props {
  shop: { _id: string; name: string; slug: string; logoUrl?: string };
  products?: Product[];
  initialProducts?: Product[];
  categories?: string[];
}

export default function CatalogueClient({ shop, products, initialProducts, categories }: Props) {
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const productList = products || initialProducts || [];
  const categoryList = categories && categories.length > 0
    ? categories
    : Array.from(new Set(productList.map((p) => p.category.toUpperCase())));

  const filtered = selectedCat === 'ALL'
    ? productList
    : productList.filter((p) => p.category.toUpperCase() === selectedCat.toUpperCase());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div
      className="min-h-screen text-white font-sans selection:bg-white/30 pb-36 animate-fade-in relative overflow-x-hidden"
      style={{ background: '#070708' }} // Pure landing page obsidian black
    >
      {/* ── BACKGROUND LAYER: Fashion editorial photo blurred ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2564&auto=format&fit=crop')",
          backgroundPosition: 'center 20%',
          backgroundSize: 'cover',
          opacity: 0.18,
          filter: 'grayscale(100%) brightness(35%) contrast(110%) blur(4px)',
        }}
      />

      {/* ── BACKGROUND LAYER 2: Paper Dot texture ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-3xl px-8 py-6 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
        style={{
          background: 'rgba(7, 7, 8, 0.45)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-light font-serif uppercase tracking-widest text-[#fdfbf7] flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            {shop.name}
          </h1>
          <p className="text-[9px] font-mono text-white/40 tracking-[0.25em] uppercase mt-1">Showroom Catalogue</p>
        </div>
        
        <Link
          href={`/shop/${shop.slug}/session`}
          className="px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[0.18em] border border-white/20 text-white hover:bg-white/10 transition-all duration-300"
        >
          Pair Session 📱
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10 relative z-10">
        {/* Large Touch Category Ribbon */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none py-2">
          {['ALL', ...categoryList].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-8 py-3.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 flex-shrink-0 cursor-pointer ${
                selectedCat === cat
                  ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] scale-102 border border-transparent'
                  : 'bg-white/3 border border-white/12 text-white/50 hover:border-white/30 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 3:4 Portrait Product Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 space-y-4 rounded-[2.5rem]" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(24px)',
          }}>
            <p className="text-sm font-mono tracking-widest uppercase text-white/40">No Garments Available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((prod) => {
              const primaryImg = prod.images.find((i) => i.is_primary)?.url || prod.images[0]?.url || '';
              const isSelected = selectedIds.includes(prod._id);

              return (
                <div
                  key={prod._id}
                  className={`group relative rounded-[2.5rem] overflow-hidden transition-all duration-500 ${
                    isSelected ? 'border-white shadow-[0_0_45px_rgba(255,255,255,0.15)] scale-[1.01]' : 'hover:scale-[1.01]'
                  }`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: isSelected ? '1px solid rgba(255,255,255,0.70)' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {/* Select Toggle */}
                  <button
                    onClick={() => toggleSelect(prod._id)}
                    className={`absolute top-5 right-5 z-20 w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                      isSelected
                        ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                        : 'bg-black/60 border-white/20 text-white hover:border-white'
                    }`}
                  >
                    {isSelected ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">+</span>
                    )}
                  </button>

                  <Link href={`/shop/${shop.slug}/product/${prod._id}`}>
                    <div className="relative aspect-[3/4] bg-black overflow-hidden rounded-[2.5rem]">
                      {primaryImg ? (
                        <Image
                          src={primaryImg}
                          alt={prod.name}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#070708]">
                          <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-transparent to-transparent opacity-60" />
                    </div>
                  </Link>

                  {/* Garment Meta */}
                  <div className="p-7 space-y-3">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-white/50 block">{prod.category}</span>
                    <h3 className="text-lg font-serif uppercase text-white tracking-wide">{prod.name}</h3>
                    <p className="text-xl font-mono text-white/40">{formatPrice(prod.price)}</p>

                    <div className="pt-3">
                      <Link
                        href={`/shop/${shop.slug}/tryon?product=${prod._id}`}
                        className="w-full text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded-full bg-white/90 text-black hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
                      >
                        Touch to try on →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Outfit Dock */}
      {selectedIds.length > 0 && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full px-8 py-5 flex items-center gap-6 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] border animate-slide-up"
          style={{
            background: 'rgba(7, 7, 8, 0.90)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
          }}
        >
          <span className="text-[10px] font-mono font-extrabold text-white/60 uppercase tracking-[0.2em]">
            {selectedIds.length} {selectedIds.length === 1 ? 'Garment Selected' : 'Garments Selected'}
          </span>
          <Link
            href={`/shop/${shop.slug}/tryon?products=${selectedIds.join(',')}`}
            className="px-6 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)] flex-shrink-0"
          >
            Try On Outfit →
          </Link>
        </div>
      )}
    </div>
  );
}
