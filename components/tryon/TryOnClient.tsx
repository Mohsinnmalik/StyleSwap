'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CameraCapture from './CameraCapture';

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
  multiProducts:       PreselectedProduct[] | null;
}

function validateFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return 'Only JPG, PNG, or WebP images are allowed.';
  if (file.size > MAX_SIZE) return 'Image must be under 5MB.';
  return null;
}

function UploadZone({
  label, hint, preview, error, onSelect, onCameraClick, disabled,
}: {
  label: string; hint: string; preview: string | null; error: string | null;
  onSelect: (file: File) => void; onCameraClick?: () => void; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex flex-col px-1">
        <p className="font-serif text-lg font-light tracking-[0.2em] uppercase text-[#fdfbf7]">{label}</p>
        <p className="text-white/40 text-xs font-light tracking-wide mt-0.5">{hint}</p>
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
        className={`relative w-full rounded-[2.5rem] transition-all duration-300 overflow-hidden group ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          preview ? 'border border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' :
          dragging ? 'border border-white bg-white/5 border-dashed'
          : error ? 'border border-red-500 bg-red-500/5'
          : 'border border-white/10 bg-white/3 backdrop-blur-xl hover:border-white/30 hover:bg-white/5'
        }`}
      >
        {preview ? (
          <div className="relative aspect-[3/4] w-full bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <p className="px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/30 bg-black/50 text-white hover:bg-black">
                Tap to change portrait
              </p>
            </div>
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/70">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-base font-light uppercase tracking-[0.18em] text-[#fdfbf7]">Upload Portrait</p>
              <p className="text-[10px] text-white/30 font-mono tracking-widest mt-1">JPG, PNG, WEBP (MAX 5MB)</p>
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
          e.target.value = '';
        }}
        disabled={disabled}
      />

      {onCameraClick && (
        <button
          type="button"
          onClick={onCameraClick}
          disabled={disabled}
          className={`w-full py-4 flex items-center justify-center gap-3 border border-white/20 rounded-full bg-white/3 text-[#fdfbf7] text-[10px] font-bold tracking-[0.2em] uppercase transition-all backdrop-blur-md ${
            disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-white hover:bg-white/10'
          }`}
        >
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {preview ? 'Retake with Live Camera' : 'Open Live Webcam Studio'}
        </button>
      )}
    </div>
  );
}

export default function TryOnClient({ shopSlug, shopId, preselectedProduct, multiProducts }: Props) {
  const router = useRouter();

  const [personFile,    setPersonFile]    = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [personError,   setPersonError]   = useState<string | null>(null);
  const [clothFile,     setClothFile]     = useState<File | null>(null);
  const [clothPreview,  setClothPreview]  = useState<string | null>(null);
  const [clothError,    setClothError]    = useState<string | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitError,   setSubmitError]   = useState<string | null>(null);
  const [cameraTarget,  setCameraTarget]  = useState<'person' | 'cloth' | null>(null);

  const productImg = preselectedProduct?.images.find((i) => i.is_primary)?.url
    ?? preselectedProduct?.images[0]?.url ?? '';

  useEffect(() => () => { if (personPreview) URL.revokeObjectURL(personPreview); }, [personPreview]);
  useEffect(() => () => { if (clothPreview) URL.revokeObjectURL(clothPreview); }, [clothPreview]);

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

  const handleCameraCapture = useCallback((file: File) => {
    if (cameraTarget === 'person') {
      handleFileSelect(file, setPersonFile, setPersonPreview, setPersonError);
    } else if (cameraTarget === 'cloth') {
      handleFileSelect(file, setClothFile, setClothPreview, setClothError);
    }
    setCameraTarget(null);
  }, [cameraTarget, handleFileSelect]);

  const isMultiMode = !!multiProducts && multiProducts.length > 1;
  const canSubmit = !!personFile && (!!preselectedProduct || isMultiMode || !!clothFile) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    const fd = new FormData();
    fd.append('shop_id', shopId);
    fd.append('person_image', personFile!);

    if (isMultiMode && multiProducts) {
      multiProducts.forEach((prod) => fd.append('product_ids', prod._id));
    } else if (preselectedProduct) {
      fd.append('product_id', preselectedProduct._id);
    } else {
      fd.append('cloth_image', clothFile!);
    }

    let data: { code?: string; error?: string };
    try {
      const res = await fetch('/api/tryon/process', { method: 'POST', body: fd });
      data = await res.json();
      if (!res.ok || !data.code) {
        setSubmitError(data.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
      setSubmitting(false);
      return;
    }

    router.push(`/shop/${shopSlug}/session?code=${data.code}`);
  };

  // Loading screen while submitting
  if (submitting) {
    return (
      <div className="min-h-screen bg-[#070708] text-white flex flex-col items-center justify-center gap-8 px-4">
        <div className="relative w-28 h-28 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shadow-2xl">
          <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
          <span className="w-4 h-4 rounded-full bg-white animate-pulse" />
        </div>
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl md:text-4xl font-light uppercase tracking-[0.2em] text-[#fdfbf7]">
            Synthesizing <span className="italic font-serif">Couture</span>...
          </h2>
          <p className="text-xs text-white/40 font-mono tracking-widest max-w-xs mx-auto">
            Google Vertex AI is rendering your tailored virtual composite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-[#fbfbfa] pb-24 font-sans selection:bg-white/30"
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

      {/* ── BACKGROUND LAYER 2: Dot grid ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="max-w-4xl mx-auto w-full min-h-screen flex flex-col relative border-x border-white/8 shadow-2xl z-10 bg-[#070708]/85 backdrop-blur-md">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 px-6 py-6 flex items-center justify-between border-b border-white/8 bg-[#070708]/90 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Link href={`/shop/${shopSlug}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white hover:border-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-white/40 block">Haute Couture Studio</span>
              <h1 className="font-serif text-2xl font-light uppercase tracking-[0.15em] text-[#fdfbf7]">
                Virtual <span className="italic font-serif">Fitting</span>
              </h1>
            </div>
          </div>
        </header>

        <div className="px-6 py-8 flex flex-col gap-10 flex-1">
          
          {/* Multi-product banner */}
          {isMultiMode && multiProducts && (
            <div
              className="rounded-[2.5rem] p-6 space-y-4 border border-white/8"
              style={{ background: 'rgba(255, 255, 255, 0.03)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
            >
              <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-white/40 bg-white/5 border border-white/12 px-4 py-1 rounded-full inline-block">
                STYLING {multiProducts.length} COUTURE PIECES
              </span>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {multiProducts.map((prod) => {
                  const img = prod.images.find((i) => i.is_primary)?.url ?? prod.images[0]?.url ?? '';
                  return (
                    <div key={prod._id} className="flex-shrink-0 flex flex-col items-center gap-2">
                      {img && <div className="w-16 h-20 rounded-xl border border-white/10 overflow-hidden"><Image src={img} alt={prod.name} width={64} height={80} className="w-full h-full object-cover" /></div>}
                      <p className="text-[9px] font-mono tracking-widest text-white/40 uppercase text-center max-w-[64px] truncate">{prod.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Single Product banner */}
          {preselectedProduct && (
            <div
              className="rounded-[2rem] p-5 flex items-center justify-between gap-4 border border-white/8"
              style={{ background: 'rgba(255, 255, 255, 0.03)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-center gap-4 min-w-0">
                {productImg && (
                  <div className="w-14 h-16 rounded-xl border border-white/10 overflow-hidden flex-shrink-0">
                    <Image src={productImg} alt={preselectedProduct.name} width={56} height={64} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-white/40 block mb-0.5">Selected Garment</span>
                  <p className="font-serif text-lg font-light uppercase tracking-wider text-[#fdfbf7] truncate">{preselectedProduct.name}</p>
                </div>
              </div>
              <Link
                href={`/shop/${shopSlug}`}
                className="px-5 py-2.5 border border-white/20 text-white rounded-full text-[9px] font-bold tracking-[0.2em] uppercase hover:bg-white/10"
              >
                Change
              </Link>
            </div>
          )}

          {/* Dual Dropzone Interface */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 1 — Person photo */}
            <UploadZone
              label="1. PORTRAIT CAPTURE"
              hint="High lighting, full body or half body."
              preview={personPreview}
              error={personError}
              onSelect={(f) => handleFileSelect(f, setPersonFile, setPersonPreview, setPersonError)}
              onCameraClick={() => setCameraTarget('person')}
              disabled={submitting}
            />

            {/* Step 2 — Cloth (only if no pre-selected) */}
            {!preselectedProduct && (
              <UploadZone
                label="2. GARMENT REFERENCE"
                hint="Flat lay photo of clothing item."
                preview={clothPreview}
                error={clothError}
                onSelect={(f) => handleFileSelect(f, setClothFile, setClothPreview, setClothError)}
                onCameraClick={() => setCameraTarget('cloth')}
                disabled={submitting}
              />
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-mono tracking-wider uppercase flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {submitError}
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-20 p-6 border-t border-white/8 bg-[#070708]/90 backdrop-blur-xl">
          <button
            id="generate-tryon-btn"
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-5 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 ${
              canSubmit
                ? 'bg-white/90 text-black hover:bg-white shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            GENERATE VIRTUAL FITTING RENDER →
          </button>
        </div>

      </div>

      {cameraTarget && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraTarget(null)}
        />
      )}
    </div>
  );
}
