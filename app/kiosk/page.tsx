'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { formatCountdown } from '@/lib/utils';

type KioskState = 'idle' | 'processing' | 'result' | 'error';

interface SessionData {
  status:           string;
  image_url?:       string;
  expires_at?:      string;
  person_image_url?: string;
  cloth_image_url?:  string;
}

// ─── Idle State ───────────────────────────────────────────────────────────────
function IdleState({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [tryonUrl, setTryonUrl] = useState('');
  const [kioskUrl, setKioskUrl] = useState('');
  const [qrSrc,    setQrSrc]    = useState('');

  useEffect(() => {
    const origin = window.location.origin;
    const slug = new URLSearchParams(window.location.search).get('shop');
    const target = slug ? `${origin}/shop/${slug}/tryon` : origin;
    setTryonUrl(target);
    setKioskUrl(`${origin}/kiosk`);
    QRCode.toDataURL(target, { width: 400, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrSrc)
      .catch(() => setQrSrc(''));
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    if (/^\d{6}$/.test(code.trim())) onSubmit(code.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 px-12 relative overflow-hidden bg-[#070708] text-white">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_transparent_70%)] pointer-events-none blur-3xl" />

      {/* Brand Header */}
      <div className="text-center space-y-4 z-10">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-[9px] font-mono font-light uppercase tracking-[0.3em]">TRYONITY HAUTE COUTURE</span>
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>
        <h1 className="text-6xl lg:text-7xl font-serif font-light tracking-[0.15em] uppercase text-white">
          Neural Virtual <span className="italic font-serif">Fitting</span>
        </h1>
        <p className="text-white/40 text-lg font-light tracking-widest uppercase">Showroom Display Terminal</p>
      </div>

      <div className="flex items-center gap-16 z-10">
        {/* QR Code Panel */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl border border-white/15 w-[220px] h-[220px] flex items-center justify-center">
            {qrSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={qrSrc} alt="Try-On QR Code" width={190} height={190} className="w-full h-full object-contain rounded-2xl" />
            ) : (
              <div className="w-[190px] h-[190px] bg-gray-100 animate-pulse rounded-2xl" />
            )}
          </div>
          <div className="text-center space-y-1">
            <p className="text-white/80 text-xs font-mono font-medium tracking-[0.2em] uppercase">📱 SCAN TO STYLE ON MOBILE</p>
            <p className="text-white/35 text-[11px] font-mono max-w-[220px] truncate">{tryonUrl}</p>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-64 bg-gradient-to-b from-transparent via-white/15 to-transparent" />

        {/* Code Input Panel */}
        <div className="flex flex-col gap-6 w-96">
          <p className="text-white/50 text-xs font-mono tracking-[0.2em] uppercase text-center">OR ENTER YOUR 6-DIGIT CODE</p>

          <div className="relative">
            <input
              ref={inputRef}
              id="kiosk-code-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="_ _ _ _ _ _"
              className="w-full bg-[#0d0c0e] border border-white/12 rounded-[2rem]
                         text-white text-5xl font-mono font-bold text-center tracking-[0.4em] tabular-nums
                         py-7 px-6 outline-none placeholder-white/20 shadow-2xl backdrop-blur-xl
                         focus:border-white focus:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300"
              autoComplete="off"
            />
            {code.length > 0 && code.length < 6 && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < code.length ? 'bg-white' : 'bg-white/25'}`} />
                ))}
              </div>
            )}
          </div>

          <button
            id="kiosk-view-result-btn"
            type="button"
            onClick={submit}
            disabled={code.length !== 6}
            className={`w-full py-5 rounded-full text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
              code.length === 6
                ? 'bg-white/90 text-black hover:bg-white shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] cursor-pointer'
                : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
            }`}
          >
            REVEAL LOOKBOOK →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Processing State ─────────────────────────────────────────────────────────
function ProcessingState({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 bg-[#070708] text-white">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
        <div className="absolute inset-4 rounded-full border-2 border-white/25 border-t-transparent animate-spin [animation-direction:reverse] [animation-duration:0.8s]" />
        <span className="w-4 h-4 rounded-full bg-white animate-pulse" />
      </div>

      <div className="text-center space-y-3">
        <h2 className="font-serif text-4xl lg:text-5xl font-light tracking-[0.18em] uppercase text-white">
          SYNTHESIZING NEURAL <span className="italic font-serif">FITTING</span>...
        </h2>
        <p className="text-white/40 text-lg font-light tracking-widest">ESTIMATED LATENCY: ~8 SECONDS</p>
      </div>

      <div className="px-10 py-5 bg-white/3 border border-white/8 rounded-[2.5rem] text-center backdrop-blur-xl shadow-2xl">
        <p className="text-[10px] text-white/40 tracking-[0.25em] uppercase mb-1 font-mono">SESSION CODE</p>
        <p className="font-mono text-3xl font-bold tracking-[0.35em] text-white tabular-nums">{code}</p>
      </div>
    </div>
  );
}

// ─── Result State (Photographic Campaign Backdrop) ──────────────────
function ResultState({ code, imageUrl, expiresAt, onReset }: {
  code: string; imageUrl: string; expiresAt: Date; onReset: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(() => expiresAt.getTime() - Date.now());
  const urls = imageUrl.split(',').filter(Boolean);
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = setInterval(() => {
      const rem = expiresAt.getTime() - Date.now();
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(tick); onReset(); }
    }, 1000);
    return () => clearInterval(tick);
  }, [expiresAt, onReset]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== idx) setIdx(index);
  };

  const scrollTo = (newIdx: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: newIdx * scrollRef.current.clientWidth, behavior: 'smooth' });
    setIdx(newIdx);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6 select-none overflow-hidden" style={{ background: '#070708' }}>
      
      {/* ── LAYER 1: Full Fashion Editorial Photo Background (high opacity, contrasty, landing page style) ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2564&auto=format&fit=crop')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          opacity: 0.35,
          filter: 'grayscale(100%) brightness(35%) contrast(120%)',
        }}
      />

      {/* ── LAYER 2: Spotlight Vignette Overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 45%, transparent 20%, #070708 95%)',
        }}
      />
      
      {/* ── LAYER 3: Vertical Blueprint Guidelines ── */}
      <div className="absolute inset-0 flex justify-between pointer-events-none z-0 px-24">
        <div className="w-px h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
        <div className="w-px h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
        <div className="w-px h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* ── LAYER 4: Giant Serif Campaign Typography Backdrop ── */}
      <div className="absolute inset-0 flex flex-col justify-between p-16 select-none pointer-events-none z-0 font-serif">
        <div className="text-[13vw] leading-none uppercase tracking-[0.25em] text-white/[0.03] font-light">
          HAUTE
        </div>
        <div className="text-[13vw] leading-none uppercase tracking-[0.25em] text-white/[0.03] text-right font-light italic">
          COUTURE
        </div>
      </div>
      
      {/* ── LAYER 5: Fine Dot grid overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── MAIN SHOWCASE IMAGE — FULL-HEIGHT (ASPECT 3:4 OR FIT) ── */}
      <div
        className="relative h-[92vh] aspect-[3/4] max-w-full rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl z-10"
        style={{
          boxShadow: '0 30px 80px rgba(0,0,0,0.9)',
          background: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        {/* Fullscreen Horizontal Swipe Gallery */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        >
          {urls.map((url, i) => (
            <div key={url} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center relative bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Look ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* ── TOP HEADER FLOATING OVERLAY ── */}
        <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex flex-col bg-black/50 backdrop-blur-md px-6 py-3.5 rounded-full border border-white/10">
            <span className="text-[8px] font-mono tracking-[0.25em] text-white/40 uppercase">TRYONITY HAUTE COUTURE</span>
            <span className="text-sm font-serif font-light tracking-widest text-[#fdfbf7] uppercase">Virtual Fitting</span>
          </div>
          {urls.length > 1 && (
            <div className="bg-white text-black text-[9px] font-mono font-medium px-5 py-2.5 uppercase tracking-[0.2em] rounded-full shadow-2xl">
              LOOK {idx + 1} OF {urls.length} — COMPOSITE
            </div>
          )}
        </div>

        {/* ── NAVIGATION ARROWS (Floating inside image viewport edges) ── */}
        {urls.length > 1 && (
          <>
            <button
              onClick={() => scrollTo(Math.max(0, idx - 1))}
              disabled={idx === 0}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/85 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center backdrop-blur-md transition-all disabled:opacity-0 disabled:pointer-events-none z-30 border border-white/15 shadow-2xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => scrollTo(Math.min(urls.length - 1, idx + 1))}
              disabled={idx === urls.length - 1}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/85 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center backdrop-blur-md transition-all disabled:opacity-0 disabled:pointer-events-none z-30 border border-white/15 shadow-2xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        {/* ── BOTTOM CONTROL OVERLAY ── */}
        <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between gap-6">
          {/* Access Info tag */}
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-[1.5rem] px-5 py-3 text-left">
            <span className="text-[8px] font-mono tracking-widest text-white/30 block mb-0.5">SESSION TIMER</span>
            <span className="text-[10px] font-mono text-white/80 uppercase">Code: <span className="font-bold text-white tracking-widest">{code}</span></span>
            <span className="block text-[9px] font-mono text-white/30 mt-0.5">Expires in: {formatCountdown(timeLeft)}</span>
          </div>

          {/* Reset Action Button */}
          <button
            id="kiosk-try-another-btn"
            type="button"
            onClick={onReset}
            className="px-8 py-4.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            Try Another Look
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 bg-[#070708] text-white">
      <div className="w-24 h-24 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center">
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center space-y-2">
        <h2 className="font-serif text-3xl font-light uppercase tracking-[0.18em] text-red-500">{message}</h2>
        <p className="text-white/40 text-sm tracking-widest font-light">Please check the access code on your mobile device and try again.</p>
      </div>
      <button
        id="kiosk-try-again-btn"
        type="button"
        onClick={onReset}
        className="px-8 py-5 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-white/20 text-white hover:bg-white/10"
      >
        TRY AGAIN →
      </button>
    </div>
  );
}

// ─── Main Kiosk Page ──────────────────────────────────────────────────────────
export default function KioskPage() {
  const [state,       setState]       = useState<KioskState>('idle');
  const [code,        setCode]        = useState('');
  const [imageUrl,    setImageUrl]    = useState('');
  const [expiresAt,   setExpiresAt]   = useState<Date | null>(null);
  const [errorMsg,    setErrorMsg]    = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setState('idle');
    setCode('');
    setImageUrl('');
    setExpiresAt(null);
    setErrorMsg('');
  }, [stopPolling]);

  const pollSession = useCallback(async (c: string) => {
    try {
      const res  = await fetch(`/api/tryon/session?code=${c}`);
      const data: SessionData = await res.json();

      if (data.status === 'done' && data.image_url) {
        stopPolling();
        setImageUrl(data.image_url);
        setExpiresAt(data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 5 * 60 * 1000));
        setState('result');
      } else if (data.status === 'not_found' || data.status === 'expired' || data.status === 'error') {
        stopPolling();
        setErrorMsg(
          data.status === 'expired' ? 'Session Has Expired'
          : data.status === 'error' ? 'Generation Failed — Please Try Again'
          : 'Code Not Found or Expired'
        );
        setState('error');
      }
    } catch {
      console.error('[kiosk] Poll error — retrying...');
    }
  }, [stopPolling]);

  const handleCodeSubmit = useCallback((submittedCode: string) => {
    setCode(submittedCode);
    setState('processing');
    pollSession(submittedCode);
    pollRef.current = setInterval(() => pollSession(submittedCode), 3000);
  }, [pollSession]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return (
    <div className="w-screen h-screen bg-[#070708] overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
      {state === 'idle'       && <IdleState onSubmit={handleCodeSubmit} />}
      {state === 'processing' && <ProcessingState code={code} />}
      {state === 'result'     && imageUrl && expiresAt && (
        <ResultState code={code} imageUrl={imageUrl} expiresAt={expiresAt} onReset={reset} />
      )}
      {state === 'error'      && <ErrorState message={errorMsg || 'Code Not Found or Expired'} onReset={reset} />}
    </div>
  );
}
