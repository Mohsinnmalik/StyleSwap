'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { formatCountdown } from '@/lib/utils';

type KioskState = 'idle' | 'processing' | 'result' | 'error';

interface SessionData {
  status:     string;
  image_url?: string;
  expires_at?: string;
}

// ─── Idle State ───────────────────────────────────────────────────────────────
function IdleState({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // URLs derive from the current deployment; the shop for the QR code comes
  // from ?shop=<slug> (e.g. /kiosk?shop=my-shop), falling back to the homepage.
  const [tryonUrl, setTryonUrl] = useState('');
  const [kioskUrl, setKioskUrl] = useState('');
  const [qrSrc,    setQrSrc]    = useState('');

  useEffect(() => {
    const origin = window.location.origin;
    const slug = new URLSearchParams(window.location.search).get('shop');
    const target = slug ? `${origin}/shop/${slug}/tryon` : origin;
    setTryonUrl(target);
    setKioskUrl(`${origin}/kiosk`);
    QRCode.toDataURL(target, { width: 400, margin: 1 })
      .then(setQrSrc)
      .catch(() => setQrSrc(''));
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    if (/^\d{6}$/.test(code.trim())) onSubmit(code.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-10">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-4 h-4 bg-tryonity-accent rounded-full animate-pulse" />
          <span className="text-tryonity-accent text-sm font-bold uppercase tracking-[0.35em]">Tryonity</span>
          <div className="w-4 h-4 bg-tryonity-accent rounded-full animate-pulse" />
        </div>
        <h1 className="text-white text-7xl font-extrabold tracking-tight leading-none mb-4">Virtual Try-On</h1>
        <p className="text-tryonity-muted text-2xl">AI-powered fashion preview</p>
      </div>

      <div className="flex items-start gap-16">
        {/* QR Code panel */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-white w-[212px] h-[212px] flex items-center justify-center">
            {qrSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={qrSrc} alt="Try-On QR Code" width={180} height={180} />
            ) : (
              <div className="w-[180px] h-[180px] bg-gray-200 animate-pulse rounded" />
            )}
          </div>
          <div className="text-center">
            <p className="text-tryonity-accent text-sm font-bold uppercase tracking-widest mb-1">📱 Scan to Try On</p>
            <p className="text-tryonity-muted text-xs max-w-[200px] text-center leading-relaxed">{tryonUrl}</p>
          </div>
        </div>

        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-tryonity-accent to-transparent" />

        {/* Code input panel */}
        <div className="flex flex-col gap-5 w-80">
          <p className="text-tryonity-muted text-xl text-center">Or enter your code</p>

          <div className="relative z-10">
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
            className="w-full relative z-20 bg-black border-4 border-tryonity-border rounded-3xl
                       text-[#ffde59] text-5xl font-extrabold text-center tracking-[0.5em] tabular-nums
                       py-8 px-6 outline-none placeholder-gray-600 shadow-lg
                       focus:border-tryonity-accent transition-all duration-200 cursor-text pointer-events-auto"
            autoComplete="off"
          />
          {code.length > 0 && code.length < 6 && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none z-30">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < code.length ? 'bg-tryonity-accent' : 'bg-gray-600'}`} />
              ))}
            </div>
          )}
        </div>

          <button
            id="kiosk-view-result-btn"
            type="button"
            onClick={submit}
            disabled={code.length !== 6}
            className={`w-full py-6 rounded-3xl text-2xl font-bold transition-all duration-200 ${
              code.length === 6
                ? 'bg-tryonity-accent hover:bg-tryonity-accent-hover text-white shadow-2xl shadow-blue-600/30 hover:scale-[1.01]'
                : 'bg-tryonity-surface text-tryonity-subtle cursor-not-allowed'
            }`}
          >
            View Look
          </button>

          <p className="text-tryonity-subtle text-sm text-center">
            Kiosk URL: <span className="text-tryonity-muted">{kioskUrl}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Processing State ─────────────────────────────────────────────────────────
function ProcessingState({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 border-4 border-tryonity-accent/15 rounded-full" />
        <div className="absolute inset-0 border-4 border-tryonity-accent border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-3 border-4 border-tryonity-accent/10 rounded-full" />
        <div className="absolute inset-3 border-4 border-tryonity-accent/40 border-t-transparent rounded-full animate-spin [animation-direction:reverse] [animation-duration:0.7s]" />
      </div>

      <div className="text-center">
        <h2 className="text-white text-5xl font-bold mb-3">Generating your look...</h2>
        <p className="text-tryonity-muted text-2xl">This usually takes about 8 seconds</p>
      </div>

      <div className="px-8 py-4 bg-tryonity-surface border border-tryonity-border rounded-3xl">
        <p className="text-tryonity-subtle text-base mb-1 text-center">Code</p>
        <p className="text-white text-3xl font-bold tracking-[0.35em] tabular-nums">{code}</p>
      </div>

      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2.5 h-2.5 bg-tryonity-accent rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Result State ─────────────────────────────────────────────────────────────
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
    <div className="relative h-full bg-black">
      {/* Full-screen scrollable image gallery */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
      >
        {urls.map((url, i) => (
          <div key={url} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Look ${i + 1}`} className="max-h-screen max-w-full object-contain" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {urls.length > 1 && (
        <>
          <button 
            onClick={() => scrollTo(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/50 hover:bg-tryonity-accent text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all disabled:opacity-0 disabled:pointer-events-none z-30 border-2 border-white/20 hover:border-black hover:text-black"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => scrollTo(Math.min(urls.length - 1, idx + 1))}
            disabled={idx === urls.length - 1}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/50 hover:bg-tryonity-accent text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all disabled:opacity-0 disabled:pointer-events-none z-30 border-2 border-white/20 hover:border-black hover:text-black"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-20" />

      {/* Tryonity top label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30">
        {urls.length > 1 && (
          <div className="bg-[#ffde59] text-black text-xs font-black px-3 py-1 uppercase tracking-widest rounded-full shadow-lg">
            Look {idx + 1} of {urls.length}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2.5 h-2.5 bg-tryonity-accent rounded-full" />
          <span className="text-white text-sm font-bold uppercase tracking-widest opacity-80 shadow-black drop-shadow-md">Tryonity Result</span>
          <div className="w-2.5 h-2.5 bg-tryonity-accent rounded-full" />
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20" />

      {/* Bottom overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30">
        <div className="bg-black/70 backdrop-blur-sm border border-tryonity-border/50 rounded-2xl px-6 py-4 text-right">
          <p className="text-tryonity-subtle text-xs mb-1">Code</p>
          <p className="text-white font-bold text-2xl tabular-nums tracking-widest">{code}</p>
          <p className={`text-xs font-medium mt-1 tabular-nums ${timeLeft > 60000 ? 'text-tryonity-muted' : 'text-amber-400'}`}>
            {formatCountdown(timeLeft)} remaining
          </p>
        </div>

        <button
          id="kiosk-try-another-btn"
          type="button"
          onClick={onReset}
          className="bg-tryonity-accent hover:bg-tryonity-accent-hover text-white font-bold px-10 py-5 rounded-2xl
                     transition-all duration-200 hover:scale-[1.02] shadow-2xl shadow-blue-600/30 text-xl"
        >
          Try Another Look
        </button>
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="w-24 h-24 bg-red-950/30 border border-red-800/50 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-white text-4xl font-bold mb-3">{message}</h2>
        <p className="text-tryonity-muted text-xl">Check the code on your phone and try again</p>
      </div>
      <button
        id="kiosk-try-again-btn"
        type="button"
        onClick={onReset}
        className="bg-tryonity-surface hover:bg-tryonity-surface2 text-white font-bold px-12 py-5 rounded-2xl
                   transition-all duration-200 border border-tryonity-border text-xl"
      >
        Try Again
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
          data.status === 'expired' ? 'Session has expired'
          : data.status === 'error' ? 'Generation failed — please try again'
          : 'Code not found or expired'
        );
        setState('error');
      }
      // 'processing' → keep polling
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
    <div className="w-screen h-screen bg-black overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
      {state === 'idle'       && <IdleState onSubmit={handleCodeSubmit} />}
      {state === 'processing' && <ProcessingState code={code} />}
      {state === 'result'     && imageUrl && expiresAt && (
        <ResultState code={code} imageUrl={imageUrl} expiresAt={expiresAt} onReset={reset} />
      )}
      {state === 'error'      && <ErrorState message={errorMsg || 'Code not found or expired'} onReset={reset} />}
    </div>
  );
}
