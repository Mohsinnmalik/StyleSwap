'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ShopData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
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

  const shopUrl = shop
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/shop/${shop.slug}`
    : '';

  // Generate QR code when mounted
  useEffect(() => {
    if (!shop?.slug || !qrRef.current) return;
    import('qrcode').then((m: any) => {
      const qrcode = m.default || m;
      qrcode.toCanvas(qrRef.current!, shopUrl, {
        width: 240,
        color: { dark: '#FFFFFF', light: '#141414' },
        errorCorrectionLevel: 'H',
      });
    });
  }, [shop?.slug, shopUrl]);

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
      setError(data.error ?? 'Failed to save');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${shop?.slug ?? 'styleswap'}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Shop form */}
      <form onSubmit={handleSave} className="card p-6 flex flex-col gap-5">
        <h2 className="section-title">Shop Details</h2>

        {/* Logo */}
        <div>
          <label className="label">Shop Logo</label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl bg-styleswap-surface2 border border-styleswap-border overflow-hidden flex items-center justify-center cursor-pointer hover:border-styleswap-accent/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo" width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-styleswap-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost text-sm px-3 py-1.5">
                Change logo
              </button>
              <p className="text-styleswap-subtle text-xs mt-1">PNG, JPG or WebP · Max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])} />
          </div>
        </div>

        <div>
          <label className="label">Shop Name</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Shop Name" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input-field resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of your shop" />
        </div>

        {/* Slug (read-only) */}
        <div>
          <label className="label">Shop URL Slug</label>
          <div className="flex items-center input-field opacity-60 gap-2">
            <span className="text-styleswap-subtle text-sm">/shop/</span>
            <span className="text-styleswap-muted text-sm">{shop?.slug ?? '—'}</span>
          </div>
          <p className="text-styleswap-subtle text-xs mt-1.5">Slug is permanent and cannot be changed after creation.</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </form>

      {/* QR Code */}
      {shop && (
        <div className="card p-6">
          <h2 className="section-title mb-1">Customer QR Code</h2>
          <p className="text-styleswap-muted text-sm mb-6">Customers scan this to access your shop and try on clothes.</p>

          <div className="flex flex-col items-center gap-5">
            <div className="p-4 bg-styleswap-surface2 rounded-3xl border border-styleswap-border">
              <canvas ref={qrRef} className="rounded-xl" />
            </div>

            <div className="w-full bg-styleswap-surface2 rounded-xl px-4 py-3 text-center">
              <p className="text-styleswap-subtle text-xs mb-1">Shop URL</p>
              <p className="text-styleswap-accent text-sm font-medium break-all">{shopUrl}</p>
            </div>

            <button onClick={downloadQR} className="btn-primary !w-auto px-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
