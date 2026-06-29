'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatCountdown } from '@/lib/utils';

const KIOSK_URL = 'https://style-swap-eight.vercel.app/kiosk';

interface SessionData {
  status:           string;
  image_url?:       string;
  expires_at?:      string;
  person_image_url?: string;
  cloth_image_url?:  string;
}

function SessionPageContent() {
  const searchParams  = useSearchParams();
  const code          = searchParams.get('code') ?? '';

  const [data,     setData]     = useState<SessionData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error,    setError]    = useState('');

  const formattedCode = code.match(/.{1,2}/g)?.join(' ') ?? code;

  const poll = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/tryon/session?code=${code}`);
      const json: SessionData = await res.json();
      setData(json);
      if (json.expires_at) {
        setTimeLeft(new Date(json.expires_at).getTime() - Date.now());
      }
    } catch {
      // ignore
    }
  }, [code]);

  useEffect(() => {
    if (!code) { setError('No session code provided.'); return; }
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [code, poll]);

  // Countdown tick
  useEffect(() => {
    if (!data?.expires_at) return;
    const tick = setInterval(() => {
      setTimeLeft(new Date(data.expires_at!).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(tick);
  }, [data?.expires_at]);

  if (error) {
    return (
      <div className="min-h-screen bg-styleswap-bg flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-red-400 text-center font-bold">{error}</p>
      </div>
    );
  }

  const isDone = data?.status === 'done';

  return (
    <div className="min-h-screen bg-styleswap-bg flex flex-col items-center justify-center px-6 py-12">
      {/* Status badge */}
      <div className={`w-20 h-20 rounded-full border flex items-center justify-center mb-8 transition-colors ${
        isDone
          ? 'bg-green-950/20 border-green-800/30'
          : 'bg-styleswap-accent/10 border-styleswap-accent/20'
      }`}>
        {isDone ? (
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-10 h-10 border-4 border-styleswap-accent/20 border-t-styleswap-accent rounded-full animate-spin" />
        )}
      </div>

      {/* Status text */}
      <p className="text-styleswap-muted text-xs uppercase tracking-widest mb-4">
        {isDone ? 'Result Ready!' : 'Processing...'}
      </p>

      {/* Code box — black bg with yellow text for maximum visibility */}
      <p className="text-styleswap-muted text-xs uppercase tracking-widest mb-2">Your Code</p>
      <div className="bg-black border-4 border-styleswap-border rounded-3xl px-10 py-8 mb-3 w-full max-w-sm text-center shadow-lg">
        <p className="text-[#ffde59] font-extrabold tracking-[0.35em] text-5xl tabular-nums select-all">{formattedCode}</p>
      </div>

      {/* Kiosk link */}
      <a href={KIOSK_URL} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 mb-6 px-5 py-3 bg-styleswap-surface border border-styleswap-border rounded-2xl hover:border-styleswap-accent transition-all group">
        <svg className="w-4 h-4 text-styleswap-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        <span className="text-styleswap-muted text-sm group-hover:text-styleswap-accent transition-colors">Open Kiosk Screen →</span>
      </a>

      {/* Instruction */}
      <p className="text-styleswap-muted text-center text-base mb-8 leading-relaxed max-w-xs">
        Enter this code on the{' '}
        <a href={KIOSK_URL} target="_blank" rel="noreferrer" className="text-styleswap-accent font-semibold underline underline-offset-2">kiosk screen</a>{' '}
        in the showroom to see your look
      </p>

      {/* Timer */}
      {timeLeft > 0 && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border mb-6 transition-colors ${
          timeLeft > 120000 ? 'bg-styleswap-surface border-styleswap-border text-styleswap-muted'
            : 'bg-amber-950/30 border-amber-800/50 text-amber-400'
        }`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium tabular-nums">Session expires in {formatCountdown(timeLeft)}</span>
        </div>
      )}

      {/* Uploaded image thumbnails */}
      {(data?.person_image_url || data?.cloth_image_url) && (
        <div className="flex gap-4 mt-2">
          {data?.person_image_url && (
            <div className="w-16 h-20 rounded-xl overflow-hidden bg-styleswap-surface border border-styleswap-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.person_image_url} alt="Your photo" className="w-full h-full object-cover" />
            </div>
          )}
          {data?.cloth_image_url && (
            <div className="w-16 h-20 rounded-xl overflow-hidden bg-styleswap-surface border border-styleswap-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.cloth_image_url} alt="Cloth" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Processing note */}
      {!isDone && (
        <div className="mt-8 px-4 py-3 bg-styleswap-accent/5 border border-styleswap-accent/20 rounded-2xl max-w-sm w-full">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 mt-0.5 flex-shrink-0">
              <div className="w-4 h-4 border-2 border-styleswap-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-styleswap-accent/80 text-xs leading-relaxed">
              Your try-on is being generated. Head to the{' '}
              <a href={KIOSK_URL} target="_blank" rel="noreferrer" className="underline">kiosk screen</a>{' '}
              — your result will appear automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-styleswap-bg flex flex-col items-center justify-center gap-6 px-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-styleswap-accent/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-styleswap-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <SessionPageContent />
    </Suspense>
  );
}
