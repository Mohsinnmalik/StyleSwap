'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Start / restart camera whenever facingMode changes
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1440 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        const e = err as DOMException;
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setError('Camera access was denied. Please allow camera permission and try again.');
        } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Could not start the camera. Please try again or upload a photo instead.');
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, stopStream]);

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror front-camera captures so the saved photo matches the preview
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Failed to capture photo. Please try again.');
        return;
      }
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopStream();
      onCapture(file);
    }, 'image/jpeg', 0.98);
  }, [facingMode, onCapture, stopStream]);

  // 3-2-1 countdown, then snap
  const startCapture = useCallback(() => {
    if (!ready || countdown !== null) return;
    setCountdown(3);
  }, [ready, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      takeSnapshot();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, takeSnapshot]);

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08080a]/90 backdrop-blur-2xl flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Take a photo">
      <div className="w-full max-w-lg bg-[#0f0f13] border border-[#d4af37]/30 rounded-3xl shadow-luxury-glow flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#d4af37]/20 bg-[#08080a]/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
            <p className="font-serif font-light text-sm uppercase tracking-[0.25em] text-[#fbfbfa]">Haute Couture Camera Studio</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close camera"
            className="w-9 h-9 rounded-full bg-white/5 border border-[#d4af37]/30 text-white hover:border-[#d4af37] hover:text-[#d4af37] flex items-center justify-center transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-[3/4] w-full bg-[#08080a] overflow-hidden">
          {/* Hairline Gold Framing Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-[#d4af37]/20">
            <div className="border-r border-b border-[#d4af37]/15" />
            <div className="border-r border-b border-[#d4af37]/15" />
            <div className="border-b border-[#d4af37]/15" />
            <div className="border-r border-b border-[#d4af37]/15" />
            <div className="border-r border-b border-[#d4af37]/15" />
            <div className="border-b border-[#d4af37]/15" />
            <div className="border-r border-[#d4af37]/15" />
            <div className="border-r border-[#d4af37]/15" />
            <div className="" />
          </div>

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center z-20">
              <svg className="w-12 h-12 text-[#ff5757]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white text-sm font-light leading-relaxed max-w-xs">{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#08080a] z-20">
                  <p className="font-serif text-sm uppercase tracking-[0.25em] text-[#d4af37] animate-pulse">Initializing Studio Optics...</p>
                </div>
              )}
              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#08080a]/60 backdrop-blur-sm">
                  <div className="w-32 h-32 rounded-full border-2 border-[#d4af37] flex items-center justify-center shadow-luxury-glow animate-ping">
                    <span className="font-serif text-7xl font-light text-[#f3e5ab]">{countdown}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between px-8 py-6 bg-[#08080a] border-t border-[#d4af37]/20">
          <button
            type="button"
            onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
            disabled={!!error}
            aria-label="Switch camera"
            className="w-12 h-12 rounded-full bg-white/5 border border-[#d4af37]/30 text-[#d4af37] hover:border-[#d4af37] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Metallic Gold Circular Shutter Button */}
          <button
            type="button"
            onClick={startCapture}
            disabled={!ready || !!error || countdown !== null}
            aria-label="Capture photo"
            className={`w-20 h-20 rounded-full border-2 border-[#d4af37] flex items-center justify-center transition-all ${
              ready && !error && countdown === null
                ? 'bg-[#d4af37]/20 shadow-luxury-glow hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-gray-800/40 border-gray-700 cursor-not-allowed opacity-40'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#e5c158] to-[#f3e5ab] shadow-luxury-gold" />
          </button>

          {/* Balance layout */}
          <div className="w-12 h-12" />
        </div>
      </div>
    </div>
  );
}

