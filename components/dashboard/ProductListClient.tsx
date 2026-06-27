'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function ProductListClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [deleting, setDeleting] = useState<string | null>(null);

  const primaryImg = (p: Product) => p.images.find((i) => i.is_primary)?.url ?? p.images[0]?.url ?? '';

  const handleToggle = async (id: string, current: boolean) => {
    setProducts((prev) => prev.map((p) => p._id === id ? { ...p, is_active: !current } : p));
    await fetch(`/api/dashboard/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    const res = await fetch(`/api/dashboard/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p._id !== id));
    }
    setDeleting(null);
  };

  if (products.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 bg-styleswap-surface2 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-styleswap-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-styleswap-muted text-sm">No products yet</p>
        <Link href="/dashboard/products/new" className="btn-primary !w-auto px-6 py-3 text-sm mt-2">
          Add your first product
        </Link>
      </div>
    );
  }

  return (
    <div className="card divide-y divide-styleswap-border">
      {products.map((product) => (
        <div key={product._id} className="flex items-center gap-4 p-4 hover:bg-styleswap-surface2/50 transition-colors">
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-styleswap-surface2 flex-shrink-0">
            {primaryImg(product) ? (
              <Image
                src={primaryImg(product)}
                alt={product.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-6 h-6 text-styleswap-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{product.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-styleswap-subtle text-xs capitalize">{product.category}</span>
              <span className="text-styleswap-border">·</span>
              <span className="text-styleswap-muted text-xs font-medium">{formatPrice(product.price)}</span>
            </div>
          </div>

          {/* Active toggle */}
          <button
            onClick={() => handleToggle(product._id, product.is_active)}
            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
              product.is_active ? 'bg-styleswap-accent' : 'bg-styleswap-border'
            }`}
            title={product.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              product.is_active ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link href={`/dashboard/products/${product._id}`} className="btn-icon" title="Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            <button
              onClick={() => handleDelete(product._id)}
              disabled={deleting === product._id}
              className="btn-icon hover:bg-red-950/50 hover:text-red-400"
              title="Delete"
            >
              {deleting === product._id ? (
                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
