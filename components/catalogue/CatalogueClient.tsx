'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

const FILTER_LABELS: Record<string, string> = {
  all: 'All', shirt: 'Shirts', kurta: 'Kurtas', jacket: 'Jackets',
  trouser: 'Trousers', suit: 'Suits', other: 'Other',
};

interface Product {
  _id: string; name: string; category: string; price: number;
  images: { url: string; public_id: string; is_primary: boolean }[];
  sizes: string[];
}

interface Shop { _id: string; name: string; slug: string; description: string; logo_url: string }

export default function CatalogueClient({
  shop, initialProducts,
}: { shop: Shop; initialProducts: Product[] }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(initialProducts.map((p) => p.category));
    return ['all', ...Array.from(cats)];
  }, [initialProducts]);

  const filtered = useMemo(() =>
    activeFilter === 'all' ? initialProducts : initialProducts.filter((p) => p.category === activeFilter),
    [initialProducts, activeFilter]
  );

  const primaryImg = (p: Product) => p.images.find((i) => i.is_primary)?.url ?? p.images[0]?.url ?? '';

  return (
    <div className="min-h-screen bg-styleswap-bg">
      {/* Header */}
      <header className="px-4 pt-10 pb-5 border-b-4 border-styleswap-border bg-styleswap-bg shadow-neo-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-1">
          {shop.logo_url && (
            <div className="w-12 h-12 rounded-neo overflow-hidden bg-white border-4 border-black flex-shrink-0 shadow-neo-sm">
              <Image src={shop.logo_url} alt={shop.name} width={48} height={48} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-styleswap-text font-black text-2xl uppercase tracking-tighter leading-tight">{shop.name}</h1>
            {shop.description && <p className="text-styleswap-subtle text-sm font-bold mt-0.5">{shop.description}</p>}
          </div>
        </div>

        {/* Accent line */}
        <div className="mt-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-[#00cc00] border-2 border-black rounded-none shadow-neo-sm" />
          <p className="text-black font-black text-xs uppercase tracking-widest border-b-2 border-black inline-block">Virtual Try-On</p>
        </div>
      </header>

      {/* Filter chips */}
      <div className="px-4 py-4 flex gap-3 overflow-x-auto scrollbar-none border-b-4 border-styleswap-border bg-white shadow-[0_4px_0_0_rgba(0,0,0,1)] z-10 relative">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`flex-shrink-0 px-5 py-2 rounded-neo text-sm font-black uppercase tracking-wider border-4 border-black transition-all duration-150 shadow-neo-sm hover:-translate-y-0.5 hover:shadow-neo active:translate-y-0.5 active:shadow-none ${
              activeFilter === cat
                ? 'bg-styleswap-accent text-black'
                : 'bg-white text-black hover:bg-[#f0f0f0]'
            }`}
          >
            {FILTER_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="px-4 py-6 pb-32">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-black font-black text-lg uppercase">No products</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((product) => (
              <div key={product._id} className="card-hover bg-white flex flex-col h-full">
                {/* Image */}
                <Link href={`/shop/${shop.slug}/product/${product._id}`} className="block border-b-4 border-black">
                  <div className="aspect-[3/4] bg-[#f0f0f0] overflow-hidden">
                    {primaryImg(product) ? (
                      <Image
                        src={primaryImg(product)}
                        alt={product.name}
                        width={300}
                        height={400}
                        className="w-full h-full object-cover grayscale-[10%]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-black font-black text-sm uppercase leading-tight line-clamp-2 flex-1">{product.name}</p>
                  <p className="text-black font-extrabold text-base mt-2 bg-[#ffde59] border-2 border-black inline-block px-2 py-0.5 shadow-neo-sm self-start">{formatPrice(product.price)}</p>

                  <Link
                    href={`/shop/${shop.slug}/tryon?product=${product._id}`}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 bg-styleswap-accent hover:bg-[#e04848] text-black text-xs font-black uppercase py-3 border-2 border-black rounded-neo shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.899L15 14M3 8h12v8H3z" />
                    </svg>
                    Try On
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating "Upload own cloth" button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6">
        <Link
          href={`/shop/${shop.slug}/tryon`}
          className="flex items-center justify-center gap-3 bg-white border-4 border-black text-black text-sm font-black uppercase tracking-widest px-6 py-4 rounded-neo shadow-neo-lg hover:bg-styleswap-accent hover:-translate-y-1 hover:shadow-[10px_10px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all w-full"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload Cloth Photo
        </Link>
      </div>
    </div>
  );
}
