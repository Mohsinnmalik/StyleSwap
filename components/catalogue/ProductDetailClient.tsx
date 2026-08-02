'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

interface ProductImage { url: string; public_id: string; is_primary: boolean }
interface Props {
  shop:    { slug: string; name: string };
  product: { _id: string; name: string; description: string; category: string; price: number; images: ProductImage[]; sizes: string[]; colors: string[] };
}

export default function ProductDetailClient({ shop, product }: Props) {
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(() => {
    const idx = product.images.findIndex((i) => i.is_primary);
    return idx !== -1 ? idx : 0;
  });
  const [selectedSize, setSelectedSize] = useState('');

  const currentImg = product.images[activeImg]?.url ?? '';

  return (
    <div
      className="min-h-screen text-white font-sans selection:bg-white/30 pb-16 animate-fade-in relative overflow-x-hidden"
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

      {/* ── BACKGROUND LAYER 2: Paper Dot grid ── */}
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Return to Catalogue
        </button>
        <span className="font-serif text-base tracking-widest uppercase text-[#fdfbf7] font-light">{shop.name}</span>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Garment Hero Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div
              className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden group"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
              }}
            >
              {currentImg ? (
                <Image src={currentImg} alt={product.name} fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-103" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-20 h-20 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail Touch Strip */}
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto scrollbar-none py-2">
                {product.images.map((img, idx) => (
                  <button
                    key={img.public_id}
                    onClick={() => setActiveImg(idx)}
                    className={`w-24 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 cursor-pointer ${
                      idx === activeImg ? 'border-white ring-4 ring-white/10 shadow-[0_0_25px_rgba(255,255,255,0.2)] scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img.url} alt="" width={96} height={112} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Touch Actions Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-8">
              <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-white/40 bg-white/5 border border-white/12 px-4 py-1.5 rounded-full inline-block">
                {product.category}
              </span>
              <h1 className="text-4xl font-serif font-light uppercase tracking-wide text-white leading-tight">
                {product.name}
              </h1>
              <p className="text-3xl font-mono text-white/80">{formatPrice(product.price)}</p>

              {/* Craftsmanship Spec Card */}
              <div
                className="rounded-[2.5rem] p-8 space-y-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                }}
              >
                <h3 className="text-[10px] font-mono font-semibold tracking-[0.25em] text-white/55 uppercase">
                  Fabric & Material Craftsmanship
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {product.description || 'Tailored with premium textiles, high-thread precision stitching, and structured silhouette drape designed for 4K haute couture presentation.'}
                </p>
              </div>

              {/* Large Touch Size Selector */}
              {product.sizes.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-semibold tracking-[0.25em] text-white/40 uppercase block px-1">Select Size</span>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s === selectedSize ? '' : s)}
                        className={`w-14 h-14 rounded-2xl text-sm font-bold border-2 transition-all duration-300 flex items-center justify-center cursor-pointer ${
                          s === selectedSize
                            ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110'
                            : 'bg-white/3 border-white/10 text-white hover:border-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colorway */}
              {product.colors.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-semibold tracking-[0.25em] text-white/40 uppercase block px-1">Colorway</span>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((c) => (
                      <span key={c} className="px-5 py-2.5 rounded-full bg-white/3 border border-white/10 text-[10px] text-white/80 font-bold uppercase tracking-widest">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Touch Action Buttons */}
            <div className="pt-6 space-y-4">
              <Link
                href={`/shop/${shop.slug}/tryon?product=${product._id}`}
                className="w-full text-center py-5 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-white/90 text-black hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
              >
                Touch to try on this piece →
              </Link>
              <Link
                href={`/shop/${shop.slug}`}
                className="w-full text-center block py-4.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/20 text-white hover:bg-white/10 transition-all duration-300"
              >
                Explore More Garments
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
