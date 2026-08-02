'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ShopData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
}

/* ─── Pinterest Curvy Glass Card Styles (Monochrome) ───────────────────── */
const glassCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
};

const goldInput: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '9999px', // Curvy rounded inputs
  padding: '14px 24px',
  color: '#fdfbf7',
  fontSize: '15px',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

/* ── Field wrapper ───────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-[10px] font-mono font-semibold tracking-[0.28em] uppercase px-1 text-white/40"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ShopSettingsClient({ shop }: { shop: ShopData | null }) {
  const [name,        setName]        = useState(shop?.name        ?? '');
  const [description, setDescription] = useState(shop?.description ?? '');
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(shop?.logo_url ?? '');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const qrRef   = useRef<HTMLCanvasElement>(null);
  const [shopUrl, setShopUrl] = useState('');

  useEffect(() => {
    if (shop) setShopUrl(`${window.location.origin}/shop/${shop.slug}`);
  }, [shop]);

  /* Generate QR */
  useEffect(() => {
    if (!shopUrl || !qrRef.current) return;
    import('qrcode').then((m: any) => {
      const qrcode = m.default || m;
      qrcode.toCanvas(qrRef.current!, shopUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });
    });
  }, [shopUrl]);

  const handleLogoFile = (file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    const fd = new FormData();
    fd.append('name', name);
    fd.append('description', description);
    if (logoFile) fd.append('logo', logoFile);
    const res  = await fetch('/api/dashboard/shop', { method: 'PUT', body: fd });
    const data = await res.json() as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? 'Failed to save changes');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    /* Upscale to 4K */
    const TARGET = 4096;
    const scale  = TARGET / canvas.width;
    const out    = document.createElement('canvas');
    out.width = TARGET;
    out.height = TARGET;
    const ctx = out.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, canvas.width * scale, canvas.height * scale);
    const link = document.createElement('a');
    link.download = `${shop?.slug ?? 'tryonity'}-atelier-print-4k.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto animate-fade-in pb-8">

      {/* ── Atelier Identity form ─────────────────────────────────────── */}
      <form onSubmit={handleSave} className="rounded-[2.5rem] overflow-hidden" style={glassCard}>

        {/* Card header */}
        <div
          className="px-8 py-6 flex items-center gap-3"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2
              className="text-base font-semibold uppercase tracking-[0.12em] text-[#fdfbf7] font-serif"
            >
              Atelier <span className="italic font-serif">Identity</span>
            </h2>
            <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-white/40 mt-0.5">
              Boutique branding &amp; display details
            </p>
          </div>
        </div>

        <div className="px-8 py-8 space-y-7">

          {/* Logo uploader */}
          <Field label="Boutique Emblem">
            <div className="flex items-center gap-5">
              {/* Circular logo preview */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 group relative"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.20)',
                  boxShadow: '0 0 18px rgba(255, 255, 255, 0.05)',
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo" width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/45">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                  </div>
                )}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.65)' }}
                >
                  <span className="text-[9px] font-mono tracking-widest uppercase text-white">Change</span>
                </div>
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-350 hover:scale-105 border border-white/20 text-white/80 hover:bg-white/10"
                >
                  Upload Image
                </button>
                <p className="text-[10px] font-mono text-white/30 tracking-wider mt-2">
                  PNG, JPG or WEBP · Max 5 MB
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
              />
            </div>
          </Field>

          {/* Name */}
          <Field label="Boutique Name">
            <input
              style={goldInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maison de Couture"
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.40)';
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(255,255,255,0.05)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.boxShadow   = 'none';
              }}
            />
          </Field>

          {/* Description */}
          <Field label="Boutique Tagline">
            <textarea
              style={{ ...goldInput, borderRadius: '1.5rem', resize: 'none' }} // slightly less rounded for textareas but still curvy
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A refined description of your atelier…"
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.40)';
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(255,255,255,0.05)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.boxShadow   = 'none';
              }}
            />
          </Field>

          {/* Slug — read only */}
          <Field label="Permanent Slug">
            <div
              className="flex items-center gap-1.5 px-6 py-3.5 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span className="text-sm font-mono text-white/30">/shop/</span>
              <span className="text-sm font-mono font-semibold text-[#fdfbf7]">{shop?.slug ?? '—'}</span>
            </div>
          </Field>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-3 px-6 py-3 rounded-full text-sm font-mono"
              style={{
                background: 'rgba(255,107,107,0.06)',
                border: '1px solid rgba(255,107,107,0.20)',
                color: '#ff8585',
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-full font-semibold text-sm tracking-[0.12em] uppercase transition-all duration-350 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2.5 mt-2 bg-white/90 text-black hover:bg-white"
          >
            {saving ? (
              <>
                <div
                  className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-black/40 border-t-black"
                />
                Saving…
              </>
            ) : saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </>
            ) : (
              'Save Atelier Details'
            )}
          </button>
        </div>
      </form>

      {/* ── QR Exporter card ──────────────────────────────────────────── */}
      {shop && (
        <div className="rounded-[2.5rem] overflow-hidden" style={glassCard}>
          {/* Card header */}
          <div
            className="px-8 py-6 flex items-center gap-3"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h2
                className="text-base font-semibold uppercase tracking-[0.12em] text-[#fdfbf7] font-serif"
              >
                QR <span className="italic font-serif">Exporter</span>
              </h2>
              <p className="text-[10px] font-mono tracking-[0.15em] uppercase text-white/40 mt-0.5">
                Download high resolution assets for print
              </p>
            </div>
          </div>

          <div className="px-8 py-8 flex flex-col items-center gap-6">
            <div
              className="p-4 bg-white rounded-[2rem]"
              style={{ boxShadow: '0 0 25px rgba(255, 255, 255, 0.05)' }}
            >
              <canvas ref={qrRef} className="block rounded-xl" />
            </div>

            <p className="text-xs font-mono text-white/40 text-center break-all max-w-sm">
              {shopUrl}
            </p>

            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-sm tracking-[0.12em] uppercase transition-all duration-350 bg-white/90 text-black hover:bg-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download 4K Print PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
