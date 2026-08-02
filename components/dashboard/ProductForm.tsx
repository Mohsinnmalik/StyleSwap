'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const CATEGORIES = ['shirt', 'kurta', 'jacket', 'trouser', 'suit', 'other'] as const;
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface ProductImage { url: string; public_id: string; is_primary: boolean }
interface ProductData {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  sizes: string[];
  colors: string[];
  images: ProductImage[];
  is_active: boolean;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  product?: ProductData;
}

export default function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();

  const [name,        setName]        = useState(product?.name        ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [category,    setCategory]    = useState(product?.category    ?? '');
  const [price,       setPrice]       = useState(product?.price?.toString() ?? '');
  const [sizes,       setSizes]       = useState<string[]>(product?.sizes   ?? []);
  const [colorInput,  setColorInput]  = useState('');
  const [colors,      setColors]      = useState<string[]>(product?.colors  ?? []);
  const [primaryIdx,  setPrimaryIdx]  = useState(() =>
    Math.max(0, (product?.images ?? []).findIndex((i) => i.is_primary))
  );

  const [keepImages, setKeepImages]   = useState<ProductImage[]>(product?.images ?? []);
  const [newFiles,   setNewFiles]     = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting]   = useState(false);
  const [error,      setError]        = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - keepImages.length - newFiles.length);
    const valid: File[] = [];
    for (const f of arr) {
      if (!ALLOWED_TYPES.includes(f.type)) { setError(`${f.name}: only JPG, PNG, or WebP allowed.`); continue; }
      if (f.size > MAX_FILE_SIZE)          { setError(`${f.name}: must be under 5MB.`); continue; }
      valid.push(f);
    }
    if (valid.length === 0) return;
    setNewFiles((prev) => [...prev, ...valid]);
    setNewPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
  };

  const totalImages = keepImages.length + newFiles.length;

  const adjustPrimaryAfterRemove = (removedAbsIdx: number) => {
    setPrimaryIdx((p) => {
      if (removedAbsIdx === p) return 0;
      const next = removedAbsIdx < p ? p - 1 : p;
      return Math.min(next, Math.max(0, totalImages - 2));
    });
  };

  const removeKeepImage = (idx: number) => {
    setKeepImages((prev) => prev.filter((_, i) => i !== idx));
    adjustPrimaryAfterRemove(idx);
  };

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
    adjustPrimaryAfterRemove(keepImages.length + idx);
  };

  const toggleSize = (s: string) => {
    setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const addColor = () => {
    const c = colorInput.trim();
    if (c && !colors.includes(c)) setColors((prev) => [...prev, c]);
    setColorInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !category || !price) {
      setError('Name, category, and price are required.');
      return;
    }

    setSubmitting(true);

    const fd = new FormData();
    fd.append('name',         name);
    fd.append('description',  description);
    fd.append('category',     category);
    fd.append('price',        price);
    fd.append('sizes',        JSON.stringify(sizes));
    fd.append('colors',       JSON.stringify(colors));
    fd.append('primaryIndex', String(primaryIdx));

    if (mode === 'edit') {
      fd.append('keepImages', JSON.stringify(keepImages));
      fd.append('is_active', String(product?.is_active ?? true));
    }
    newFiles.forEach((f) => fd.append('images', f));

    const url    = mode === 'create' ? '/api/dashboard/products' : `/api/dashboard/products/${product!._id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, { method, body: fd });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      return;
    } finally {
      setSubmitting(false);
    }

    router.push('/dashboard/products');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="card-luxury-glass p-8 space-y-6 text-[#fbfbfa]">
      {/* Name */}
      <div className="space-y-2">
        <label className="text-xs font-sans tracking-[0.2em] uppercase text-[#8e8e93] block">Garment Name *</label>
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Silk Tuxedo Blazer" />
      </div>

      {/* Category + Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-sans tracking-[0.2em] uppercase text-[#8e8e93] block">Category *</label>
          <select
            className="input-field bg-[#08080a]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-sans tracking-[0.2em] uppercase text-[#8e8e93] block">Retail Price (₹) *</label>
          <input className="input-field" type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1499" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-xs font-sans tracking-[0.2em] uppercase text-[#8e8e93] block">Craftsmanship & Fabric Description</label>
        <textarea className="input-field resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="High-thread count mulberry silk with gold thread embroidery..." />
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <label className="text-xs font-sans tracking-[0.2em] uppercase text-[#8e8e93] block">Bespoke Size Availability</label>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSize(s)}
              className={`w-12 h-12 rounded-full font-mono text-xs font-bold border transition-all ${
                sizes.includes(s)
                  ? 'bg-[#d4af37] border-[#d4af37] text-[#08080a] shadow-luxury-gold'
                  : 'bg-[#08080a] border-[#d4af37]/30 text-[#8e8e93] hover:border-[#d4af37]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <label className="text-xs font-sans tracking-[0.2em] uppercase text-[#8e8e93] block">Color Variants</label>
        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
            placeholder="e.g. Midnight Black, Champagne Gold"
          />
          <button type="button" onClick={addColor} className="btn-luxury-glass text-xs !py-3 !px-6">ADD COLOR</button>
        </div>
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {colors.map((c) => (
              <span key={c} className="px-3 py-1 rounded-full bg-[#08080a] border border-[#d4af37]/30 text-xs text-[#f3e5ab] font-sans tracking-wide inline-flex items-center gap-2">
                {c}
                <button type="button" onClick={() => setColors((prev) => prev.filter((x) => x !== c))} className="text-[#8e8e93] hover:text-[#ff5757]">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="space-y-3">
        <label className="text-xs font-sans tracking-[0.2em] uppercase text-[#8e8e93] block">High-Res Garment Imagery (Up to 5)</label>

        {totalImages > 0 && (
          <div className="flex flex-wrap gap-4 mb-3">
            {keepImages.map((img, idx) => (
              <div key={img.public_id} className={`relative w-24 h-28 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${primaryIdx === idx ? 'border-[#d4af37] shadow-luxury-glow' : 'border-[#d4af37]/20'}`} onClick={() => setPrimaryIdx(idx)}>
                <Image src={img.url} alt="" fill className="object-cover" />
                {primaryIdx === idx && (
                  <div className="absolute top-1.5 left-1.5 bg-[#d4af37] text-[#08080a] rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">
                    ★
                  </div>
                )}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeKeepImage(idx); }} className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/80 text-white rounded-full flex items-center justify-center text-xs hover:bg-[#ff5757]">×</button>
              </div>
            ))}
            {newPreviews.map((src, idx) => {
              const absIdx = keepImages.length + idx;
              return (
                <div key={src} className={`relative w-24 h-28 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${primaryIdx === absIdx ? 'border-[#d4af37] shadow-luxury-glow' : 'border-[#d4af37]/20'}`} onClick={() => setPrimaryIdx(absIdx)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeNewFile(idx); }} className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/80 text-white rounded-full flex items-center justify-center text-xs hover:bg-[#ff5757]">×</button>
                </div>
              );
            })}
          </div>
        )}

        {totalImages < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-[#d4af37]/40 bg-[#08080a]/60 rounded-3xl py-8 flex flex-col items-center gap-2 hover:border-[#d4af37] transition-all group"
          >
            <div className="w-10 h-10 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-xs font-sans tracking-[0.2em] uppercase text-[#d4af37]">UPLOAD GARMENT PHOTOGRAPHY</p>
            <p className="text-[11px] text-[#8e8e93] font-light">JPG, PNG, WebP · Max 5MB each · {5 - totalImages} slots remaining</p>
          </button>
        )}
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {totalImages > 0 && <p className="text-[11px] text-[#8e8e93] font-light italic">Tap any image to mark as primary showcase thumbnail (marked with ★).</p>}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#ff5757]/10 border border-[#ff5757]/30 text-[#ff5757] text-xs font-sans tracking-wide">
          {error}
        </div>
      )}

      {/* Submit Controls */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#d4af37]/20">
        <button type="button" onClick={() => router.back()} className="btn-luxury-glass text-xs !py-4 flex-1">CANCEL</button>
        <button type="submit" disabled={submitting} className="btn-luxury-gold text-xs !py-4 flex-1">
          {submitting ? 'SAVING GARMENT…' : mode === 'create' ? 'PUBLISH COUTURE PIECE' : 'SAVE ATELIER CHANGES'}
        </button>
      </div>
    </form>
  );
}

