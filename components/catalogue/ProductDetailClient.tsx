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
    <div className="min-h-screen bg-styleswap-bg font-sans">
      <div className="w-full max-w-6xl mx-auto min-h-screen flex flex-col relative bg-styleswap-surface pb-24 shadow-2xl">
        {/* Back bar */}
        <div className="sticky top-0 z-50 bg-styleswap-bg/80 backdrop-blur-sm border-b-4 border-styleswap-border px-6 h-20 flex items-center gap-4">
          <button onClick={() => router.back()} className="btn-icon bg-white border-2 border-black hover:bg-styleswap-accent hover:-translate-y-0.5 shadow-neo-sm hover:shadow-neo transition-all rounded-neo flex items-center justify-center w-12 h-12">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="text-black font-black uppercase text-lg tracking-tighter truncate border-b-4 border-black pb-0.5">{shop.name}</p>
        </div>

        <div className="flex flex-col xl:grid xl:grid-cols-2 xl:gap-8 p-0 xl:p-8">
          {/* Hero image */}
          <div className="relative aspect-[3/4] xl:aspect-[4/5] bg-[#f0f0f0] border-b-4 xl:border-4 border-black overflow-hidden flex-shrink-0 xl:rounded-neo xl:shadow-neo">
            {currentImg ? (
              <Image src={currentImg} alt={product.name} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Image thumbs */}
            {product.images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={img.public_id}
                    onClick={() => setActiveImg(idx)}
                    className={`w-14 h-14 bg-white shadow-neo-sm overflow-hidden border-4 transition-all hover:-translate-y-1 hover:shadow-neo ${idx === activeImg ? 'border-styleswap-accent' : 'border-black opacity-80 hover:opacity-100'}`}
                  >
                    <Image src={img.url} alt="" width={56} height={56} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-6 py-8 xl:p-0 flex flex-col flex-1 bg-styleswap-surface">
            <p className="text-styleswap-accent text-sm font-black uppercase tracking-widest border-b-4 border-black inline-block self-start mb-4">{product.category}</p>
            <h1 className="text-black text-3xl xl:text-4xl font-black uppercase tracking-tighter leading-snug">{product.name}</h1>
            <p className="text-black bg-[#ffde59] border-4 border-black px-4 py-2 shadow-neo-sm self-start text-2xl xl:text-3xl font-extrabold mt-4">{formatPrice(product.price)}</p>

            {/* Description */}
            {product.description && (
              <p className="text-black/80 font-bold text-base mt-6 leading-relaxed bg-[#f0f0f0] border-4 border-black p-5 rounded-neo shadow-neo-sm">{product.description}</p>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mt-8">
                <p className="text-black font-black text-base uppercase tracking-wider mb-4">Available Sizes</p>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s === selectedSize ? '' : s)}
                      className={`px-5 py-3 font-black text-base uppercase border-4 border-black shadow-neo-sm transition-all hover:-translate-y-0.5 hover:shadow-neo ${
                        s === selectedSize
                          ? 'bg-styleswap-accent text-black'
                          : 'bg-white text-black hover:bg-gray-100'
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
              <div className="mt-8">
                <p className="text-black font-black text-base uppercase tracking-wider mb-4">Colors</p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((c) => (
                    <span key={c} className="bg-white text-black font-bold uppercase text-sm px-4 py-2 border-4 border-black shadow-neo-sm">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1 min-h-[60px]" />

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col gap-4">
              <Link
                href={`/shop/${shop.slug}/tryon?product=${product._id}`}
                className="w-full py-5 bg-styleswap-accent border-4 border-black text-black text-lg font-black uppercase shadow-neo hover:-translate-y-1 hover:shadow-neo-lg active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-3 rounded-neo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.899L15 14M3 8h12v8H3z" />
                </svg>
                Try This On
              </Link>
              <Link href={`/shop/${shop.slug}`} className="w-full py-5 bg-white border-4 border-black text-black text-lg font-black uppercase shadow-neo hover:-translate-y-1 hover:shadow-neo-lg active:translate-y-1 active:shadow-none transition-all flex justify-center items-center rounded-neo">
                Back to Catalogue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
