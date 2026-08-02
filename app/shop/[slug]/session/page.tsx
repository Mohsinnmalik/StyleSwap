'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatCountdown } from '@/lib/utils';

const KIOSK_URL = '/kiosk';
const TERMINAL_STATUSES = ['done', 'expired', 'not_found', 'error'];

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
      const res = await fetch(`/api/tryon/session?code=${encodeURIComponent(code)}`);
      const json: SessionData = await res.json();
      if (json.status === 'rate_limited') return;
      setData(json);
      if (json.expires_at) {
        setTimeLeft(new Date(json.expires_at).getTime() - Date.now());
      }
    } catch {
      // ignore transient network errors
    }
  }, [code]);

  const status = data?.status;

  useEffect(() => {
    if (!code) { setError('No session code provided.'); return; }
    if (status && TERMINAL_STATUSES.includes(status)) return;
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [code, poll, status]);

  useEffect(() => {
    if (!data?.expires_at) return;
    const tick = setInterval(() => {
      setTimeLeft(new Date(data.expires_at!).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(tick);
  }, [data?.expires_at]);

  const terminalMessage =
    status === 'not_found' ? 'Session not found. Please check the code or start a new try-on.'
    : status === 'expired' ? 'This session has expired. Please start a new try-on.'
    : status === 'error'   ? 'Sorry, generating your try-on failed. Please go back and try again.'
    : null;

  if (error || terminalMessage) {
    return (
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-red-500 text-center font-light text-sm uppercase tracking-widest">{error || terminalMessage}</p>
      </div>
    );
  }

  const isDone = data?.status === 'done';

  return (
    <div className="min-h-screen bg-[#070708] text-[#fdfbf7] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden select-none">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_transparent_70%)] pointer-events-none blur-3xl" />

      {/* Status Emblem */}
      <div className={`w-20 h-20 rounded-full border flex items-center justify-center mb-8 shadow-2xl transition-all ${
        isDone
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
          : 'bg-white/10 border-white/40 text-white'
      }`}>
        {isDone ? (
          <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/50 mb-3">
        {isDone ? 'NEURAL COMPOSITE READY' : 'SYNTHESIZING COUTURE RENDER...'}
      </span>

      {/* Dark Glass Vault Card */}
      <div
        className="w-full max-w-md rounded-[2.5rem] p-8 mb-6 text-center backdrop-blur-xl shadow-2xl space-y-4"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/40 block">BOUTIQUE ACCESS CODE</span>
        
        <div className="py-4 px-6 rounded-2xl bg-[#0d0c0e] border border-white/10 shadow-inner">
          <p className="font-mono tracking-[0.4em] text-4xl sm:text-5xl font-bold text-white select-all">
            {formattedCode}
          </p>
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          Enter this 6-digit access code on the showroom terminal screen to reveal your haute couture lookbook.
        </p>
      </div>

      {/* Active Countdown Timer Pill */}
      {timeLeft > 0 && (
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-white/80 text-[10px] font-mono tracking-widest mb-8">
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          SESSION EXPIRES IN {formatCountdown(timeLeft)}
        </div>
      )}

      {/* Direct Kiosk Launcher Link */}
      <a
        href={KIOSK_URL}
        target="_blank"
        rel="noreferrer"
        className="px-8 py-4.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-white/20 text-white hover:bg-white/10 transition-all duration-300"
      >
        Open Showroom Terminal Screen →
      </a>

      {/* Uploaded image thumbnails */}
      {(data?.person_image_url || data?.cloth_image_url) && (
        <div className="flex gap-4 mt-8">
          {data?.person_image_url && (
            <div className="w-16 h-20 rounded-2xl overflow-hidden border border-white/12 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.person_image_url} alt="Your portrait" className="w-full h-full object-cover" />
            </div>
          )}
          {data?.cloth_image_url && (
            <div className="w-16 h-20 rounded-2xl overflow-hidden border border-white/12 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.cloth_image_url} alt="Garment reference" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    }>
      <SessionPageContent />
    </Suspense>
  );
}
