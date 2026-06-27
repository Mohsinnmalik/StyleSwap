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
    <div className="min-h-screen bg-styleswap-bg">
      {/* Back bar */}
      <div className="sticky top-0 z-50 bg-styleswap-bg/80 backdrop-blur-sm border-b border-styleswap-border px-4 h-14 flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-icon">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="text-white text-sm font-medium truncate">{shop.name}</p>
      </div>

      {/* Hero image */}
      <div className="relative aspect-[3/4] bg-styleswap-surface overflow-hidden">
        {currentImg ? (
          <Image src={currentImg} alt={product.name} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-styleswap-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Image thumbs */}
        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {product.images.map((img, idx) => (
              <button
                key={img.public_id}
                onClick={() => setActiveImg(idx)}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-colors ${idx === activeImg ? 'border-styleswap-accent' : 'border-transparent'}`}
              >
                <Image src={img.url} alt="" width={40} height={40} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-5">
        <p className="text-styleswap-subtle text-xs uppercase tracking-wider capitalize mb-1">{product.category}</p>
        <h1 className="text-white text-xl font-bold leading-snug">{product.name}</h1>
        <p className="text-styleswap-accent text-2xl font-bold mt-2">{formatPrice(product.price)}</p>

        {/* Description */}
        {product.description && (
          <p className="text-styleswap-muted text-sm mt-4 leading-relaxed">{product.description}</p>
        )}

        {/* Sizes */}
        {product.sizes.length > 0 && (
          <div className="mt-5">
            <p className="label">Available Sizes</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s === selectedSize ? '' : s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    s === selectedSize
                      ? 'bg-styleswap-accent/20 border-styleswap-accent text-styleswap-accent'
                      : 'bg-styleswap-surface border-styleswap-border text-styleswap-muted hover:border-styleswap-border2'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Colors */}
        {product.colors.length > 0 && (
          <div className="mt-4">
            <p className="label">Colors</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <span key={c} className="badge bg-styleswap-surface2 text-styleswap-muted border border-styleswap-border">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/shop/${shop.slug}/tryon?product=${product._id}`}
            className="btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.899L15 14M3 8h12v8H3z" />
            </svg>
            Try This On
          </Link>
          <Link href={`/shop/${shop.slug}`} className="btn-secondary">
            Back to Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
