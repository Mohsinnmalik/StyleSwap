'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

interface PreselectedProduct {
  _id: string;
  name: string;
  images: { url: string; public_id: string; is_primary: boolean }[];
}

interface Props {
  shopSlug:            string;
  shopId:              string;
  preselectedProduct:  PreselectedProduct | null;
}

function validateFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return 'Only JPG, PNG, or WebP images are allowed.';
  if (file.size > MAX_SIZE) return 'Image must be under 5MB.';
  return null;
}

function UploadZone({
  label, hint, preview, error, onSelect, disabled,
}: {
  label: string; hint: string; preview: string | null; error: string | null;
  onSelect: (file: File) => void; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex flex-col">
        <p className="text-styleswap-text text-lg font-black tracking-widest uppercase">{label}</p>
        <p className="text-styleswap-subtle text-sm font-bold mt-0.5">{hint}</p>
      </div>

      <button
        type="button"
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) onSelect(f);
        }}
        disabled={disabled}
        className={`relative w-full rounded-neo transition-all duration-150 overflow-hidden group ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          preview ? 'border-4 border-styleswap-border shadow-neo' :
          dragging ? 'border-4 border-styleswap-border bg-styleswap-accent border-dashed shadow-neo'
          : error ? 'border-4 border-styleswap-error bg-red-100 shadow-neo'
          : 'border-4 border-styleswap-border bg-[#ffffff] hover:bg-styleswap-accent hover:-translate-y-1 hover:shadow-neo transition-all'
        }`}
      >
        {preview ? (
          <div className="relative aspect-[3/4] w-full bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-full object-cover grayscale-[20%] contrast-125" />
            <div className="absolute inset-0 bg-styleswap-accent opacity-0 group-hover:opacity-20 transition-opacity duration-150 flex items-end justify-center pb-6">
              <p className="text-black text-sm font-black uppercase tracking-wider px-4 py-2 bg-white border-4 border-black shadow-neo-sm">Tap to change</p>
            </div>
            <div className="absolute top-4 right-4 w-10 h-10 bg-white border-4 border-black rounded-neo flex items-center justify-center shadow-neo-sm hover:-translate-y-1 hover:shadow-neo transition-all">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-4 px-6">
            <div className={`w-16 h-16 rounded-neo flex items-center justify-center border-4 border-black transition-colors duration-150 bg-white shadow-neo-sm`}>
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-black text-lg font-black uppercase tracking-wider">Upload Image</p>
              <p className="text-black font-bold text-sm mt-1">JPG, PNG, WebP (Max 5MB)</p>
            </div>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
        disabled={disabled}
      />
    </div>
  );
}

export default function TryOnClient({ shopSlug, shopId, preselectedProduct }: Props) {
  const router = useRouter();

  const [personFile,    setPersonFile]    = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [personError,   setPersonError]   = useState<string | null>(null);
  const [clothFile,     setClothFile]     = useState<File | null>(null);
  const [clothPreview,  setClothPreview]  = useState<string | null>(null);
  const [clothError,    setClothError]    = useState<string | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitError,   setSubmitError]   = useState<string | null>(null);

  const productImg = preselectedProduct?.images.find((i) => i.is_primary)?.url
    ?? preselectedProduct?.images[0]?.url ?? '';

  const handleFileSelect = useCallback((
    file: File,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void,
    setError: (e: string | null) => void,
  ) => {
    const err = validateFile(file);
    setError(err);
    if (!err) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setFile(null);
      setPreview(null);
    }
  }, []);

  const canSubmit = !!personFile && (!!preselectedProduct || !!clothFile) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    const fd = new FormData();
    fd.append('shop_id',      shopId);
    fd.append('person_image', personFile!);

    if (preselectedProduct) {
      fd.append('product_id', preselectedProduct._id);
    } else {
      fd.append('cloth_image', clothFile!);
    }

    const res = await fetch('/api/tryon/process', { method: 'POST', body: fd });
    const data = await res.json() as { code?: string; error?: string };

    if (!res.ok || !data.code) {
      setSubmitError(data.error ?? 'Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    router.push(`/shop/${shopSlug}/session?code=${data.code}`);
  };

  // Loading screen while submitting
  if (submitting) {
    return (
      <div className="min-h-screen bg-styleswap-bg flex flex-col items-center justify-center gap-8 px-4">
        <div className="relative w-32 h-32 border-8 border-black shadow-neo-lg bg-white flex items-center justify-center">
          <div className="absolute inset-0 border-8 border-styleswap-accent animate-spin-slow" style={{ animationDuration: '4s' }} />
          <p className="text-black font-black text-2xl uppercase animate-pulse">Wait</p>
        </div>
        <div className="text-center">
          <h2 className="text-styleswap-text text-4xl font-black uppercase tracking-tighter">Processing...</h2>
          <p className="text-styleswap-subtle text-lg font-bold mt-3 max-w-xs mx-auto border-2 border-black bg-white p-2 shadow-neo-sm">Our AI is rendering your look.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-styleswap-bg text-styleswap-text pb-24 font-sans">
      
      {/* Centered Mobile-like container for desktop */}
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col relative bg-styleswap-surface border-x-4 border-styleswap-border shadow-neo">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 px-5 pt-8 pb-4 flex items-center justify-between bg-styleswap-bg border-b-4 border-styleswap-border shadow-neo-sm">
          <div className="flex items-center gap-4">
            <Link href={`/shop/${shopSlug}`} className="btn-icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <p className="text-styleswap-accent text-xs font-black uppercase tracking-widest border-b-2 border-black inline-block">StyleSwap AI</p>
              <h1 className="text-styleswap-text text-2xl font-black uppercase tracking-tighter">Virtual Try-On</h1>
            </div>
          </div>
        </header>

        <div className="px-5 pt-8 pb-10 flex flex-col gap-10 flex-1">
          
          {/* Pre-selected product banner */}
          {preselectedProduct && (
            <div className="card p-4 flex items-center gap-4 bg-[#ffffff]">
              {productImg && (
                <div className="w-16 h-16 border-4 border-black flex-shrink-0 bg-white shadow-neo-sm">
                  <Image src={productImg} alt={preselectedProduct.name} width={64} height={64} className="w-full h-full object-cover grayscale-[10%]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-styleswap-accent text-xs uppercase font-black tracking-widest mb-1 border-b-2 border-black inline-block">Selected</p>
                <p className="text-black font-black text-lg truncate uppercase">{preselectedProduct.name}</p>
              </div>
              <Link href={`/shop/${shopSlug}`} className="px-4 py-2 bg-white border-4 border-black shadow-neo-sm text-black text-sm font-black uppercase hover:bg-styleswap-accent hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0.5 transition-all">
                Change
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-10">
            {/* Step 1 — Person photo */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-styleswap-accent border-4 border-black flex items-center justify-center shadow-neo-sm rounded-neo">
                  <span className="text-black text-xl font-black">1</span>
                </div>
                <h2 className="text-styleswap-text text-3xl font-black uppercase tracking-tighter">Your Photo</h2>
              </div>
              <UploadZone
                label="Full Body Image"
                hint="Good lighting, facing forward."
                preview={personPreview}
                error={personError}
                onSelect={(f) => handleFileSelect(f, setPersonFile, setPersonPreview, setPersonError)}
                disabled={submitting}
              />
            </div>

            {/* Step 2 — Cloth (only if no pre-selected) */}
            {!preselectedProduct && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00cc00] border-4 border-black flex items-center justify-center shadow-neo-sm rounded-neo">
                    <span className="text-black text-xl font-black">2</span>
                  </div>
                  <h2 className="text-styleswap-text text-3xl font-black uppercase tracking-tighter">Garment</h2>
                </div>
                <UploadZone
                  label="Flat or Hanger"
                  hint="Clear view of the clothing item."
                  preview={clothPreview}
                  error={clothError}
                  onSelect={(f) => handleFileSelect(f, setClothFile, setClothPreview, setClothError)}
                  disabled={submitting}
                />
              </div>
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="flex items-start gap-3 px-5 py-4 bg-styleswap-error border-4 border-black shadow-neo">
              <svg className="w-6 h-6 text-black flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-black text-base font-bold uppercase">{submitError}</p>
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-20 p-5 bg-styleswap-bg border-t-4 border-styleswap-border shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
          <button
            id="generate-tryon-btn"
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-4 flex items-center justify-center gap-3 text-lg font-black uppercase tracking-wider transition-all duration-150 border-4 border-black rounded-neo ${
              canSubmit 
                ? 'bg-styleswap-accent text-black shadow-neo hover:shadow-neo-lg hover:-translate-y-1 active:translate-y-1 active:shadow-none'
                : 'bg-[#d1d5db] text-gray-500 shadow-none cursor-not-allowed'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate
          </button>
          
          {!canSubmit && !submitting && (
            <p className="text-center text-styleswap-border text-sm font-black uppercase tracking-wider mt-4">
              {!personFile
                ? 'Upload photo to continue'
                : !preselectedProduct && !clothFile
                ? 'Upload garment to continue'
                : ''}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
