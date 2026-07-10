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
    }, 'image/jpeg', 0.92);
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Take a photo">
      <div className="w-full max-w-lg bg-styleswap-bg border-4 border-black shadow-neo-lg flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-4 border-black bg-white">
          <p className="text-black text-lg font-black uppercase tracking-widest">Take a Photo</p>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close camera"
            className="w-10 h-10 bg-white border-4 border-black flex items-center justify-center shadow-neo-sm hover:bg-styleswap-error hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-[3/4] w-full bg-black overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white font-bold">{error}</p>
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white font-black uppercase tracking-widest animate-pulse">Starting camera...</p>
                </div>
              )}
              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <p className="text-white text-8xl font-black">{countdown}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-t-4 border-black">
          <button
            type="button"
            onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
            disabled={!!error}
            aria-label="Switch camera"
            className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center shadow-neo-sm hover:bg-styleswap-accent hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            type="button"
            onClick={startCapture}
            disabled={!ready || !!error || countdown !== null}
            aria-label="Capture photo"
            className={`w-16 h-16 rounded-full border-4 border-black flex items-center justify-center transition-all ${
              ready && !error && countdown === null
                ? 'bg-styleswap-accent shadow-neo hover:-translate-y-1 hover:shadow-neo-lg active:translate-y-0.5 active:shadow-none'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-black" />
          </button>

          {/* Spacer to balance layout */}
          <div className="w-12 h-12" />
        </div>
      </div>
    </div>
  );
}
