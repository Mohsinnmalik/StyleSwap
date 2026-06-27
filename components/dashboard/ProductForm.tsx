'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const CATEGORIES = ['shirt', 'kurta', 'jacket', 'trouser', 'suit', 'other'] as const;
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

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
  const [primaryIdx,  setPrimaryIdx]  = useState(0);

  // Existing images (edit mode) to keep
  const [keepImages, setKeepImages]   = useState<ProductImage[]>(product?.images ?? []);
  // New files to upload
  const [newFiles,   setNewFiles]     = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting]   = useState(false);
  const [error,      setError]        = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - keepImages.length - newFiles.length);
    setNewFiles((prev) => [...prev, ...arr]);
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setNewPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeKeepImage = (idx: number) => {
    setKeepImages((prev) => prev.filter((_, i) => i !== idx));
    if (primaryIdx > 0) setPrimaryIdx((p) => p - 1);
  };

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalImages = keepImages.length + newFiles.length;

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
    }
    newFiles.forEach((f) => fd.append('images', f));

    const url    = mode === 'create' ? '/api/dashboard/products' : `/api/dashboard/products/${product!._id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const res = await fetch(url, { method, body: fd });
    const data = await res.json() as { error?: string };

    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong');
      return;
    }

    router.push('/dashboard/products');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Name */}
      <div>
        <label className="label">Product Name *</label>
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Classic White Kurta" />
      </div>

      {/* Category + Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select
            className="input-field appearance-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Price (₹) *</label>
          <input className="input-field" type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1499" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea className="input-field resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description…" />
      </div>

      {/* Sizes */}
      <div>
        <label className="label">Available Sizes</label>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSize(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                sizes.includes(s)
                  ? 'bg-styleswap-accent/20 border-styleswap-accent text-styleswap-accent'
                  : 'bg-styleswap-surface border-styleswap-border text-styleswap-muted hover:border-styleswap-border2'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="label">Colors</label>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
            placeholder="e.g. Navy Blue"
          />
          <button type="button" onClick={addColor} className="btn-secondary !w-auto px-4">Add</button>
        </div>
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {colors.map((c) => (
              <span key={c} className="badge bg-styleswap-surface2 text-styleswap-muted border border-styleswap-border gap-1">
                {c}
                <button type="button" onClick={() => setColors((prev) => prev.filter((x) => x !== c))} className="ml-1 hover:text-white">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div>
        <label className="label">Product Images (up to 5)</label>

        {/* Image previews */}
        {totalImages > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {keepImages.map((img, idx) => (
              <div key={img.public_id} className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-colors ${primaryIdx === idx ? 'border-styleswap-accent' : 'border-styleswap-border'}`} onClick={() => setPrimaryIdx(idx)}>
                <Image src={img.url} alt="" fill className="object-cover" />
                {primaryIdx === idx && (
                  <div className="absolute top-1 left-1 bg-styleswap-accent rounded-full w-4 h-4 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                )}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeKeepImage(idx); }} className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600">×</button>
              </div>
            ))}
            {newPreviews.map((src, idx) => {
              const absIdx = keepImages.length + idx;
              return (
                <div key={src} className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-colors ${primaryIdx === absIdx ? 'border-styleswap-accent' : 'border-styleswap-border'}`} onClick={() => setPrimaryIdx(absIdx)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeNewFile(idx); }} className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600">×</button>
                </div>
              );
            })}
          </div>
        )}

        {totalImages < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-styleswap-border rounded-2xl py-6 flex flex-col items-center gap-2 hover:border-styleswap-accent/50 hover:bg-styleswap-surface2/50 transition-colors"
          >
            <svg className="w-7 h-7 text-styleswap-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-styleswap-muted text-sm">Click to upload images</p>
            <p className="text-styleswap-subtle text-xs">JPG, PNG, WebP · Max 5MB each · {5 - totalImages} remaining</p>
          </button>
        )}
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {totalImages > 0 && <p className="text-styleswap-subtle text-xs mt-2">Click an image to set as primary (star icon)</p>}
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-400 text-sm bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary !w-auto flex-1">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
          ) : mode === 'create' ? 'Add Product' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
