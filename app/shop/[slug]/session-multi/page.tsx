'use client';

// This page is intentionally a client component to handle dynamic polling.
// It accepts ?codes=code1,code2,code3 and shows all results side by side.

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';

interface ResultItem {
  code:      string;
  status:    'polling' | 'done' | 'error';
  image_url: string | null;
}

export default function SessionMultiPage() {
  const params      = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const codesParam  = searchParams.get('codes') ?? '';
  const codes       = codesParam.split(',').filter(Boolean);

  const [results, setResults] = useState<ResultItem[]>(
    codes.map((c) => ({ code: c, status: 'polling', image_url: null }))
  );
  const [activeIdx, setActiveIdx] = useState(0);

  const pollAll = useCallback(async () => {
    const updated = await Promise.all(
      codes.map(async (code, i) => {
        const current = results[i];
        if (current?.status === 'done' || current?.status === 'error') return current;
        try {
          const res  = await fetch(`/api/tryon/session?code=${code}`);
          const data = await res.json();
          if (data.status === 'done' && data.image_url) {
            return { code, status: 'done' as const, image_url: data.image_url };
          } else if (data.status === 'expired' || data.status === 'not_found') {
            return { code, status: 'error' as const, image_url: null };
          }
          return { code, status: 'polling' as const, image_url: null };
        } catch {
          return { code, status: 'polling' as const, image_url: null };
        }
      })
    );
    setResults(updated);
  }, [codes, results]);

  useEffect(() => {
    if (codes.length === 0) return;
    const interval = setInterval(() => {
      pollAll();
    }, 3000);
    pollAll();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes.length]);

  const doneCount    = results.filter((r) => r.status === 'done').length;
  const totalCount   = results.length;
  const allDone      = doneCount === totalCount;

  if (codes.length === 0) {
    return (
      <div className="min-h-screen bg-styleswap-bg flex items-center justify-center">
        <p className="text-black font-black text-xl uppercase">No session codes found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-styleswap-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 px-5 pt-8 pb-4 flex items-center justify-between bg-styleswap-bg border-b-4 border-styleswap-border shadow-neo-sm">
        <div className="flex items-center gap-4">
          <Link href={`/shop/${params.slug}`} className="btn-icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="text-styleswap-accent text-xs font-black uppercase tracking-widest border-b-2 border-black inline-block">StyleSwap AI</p>
            <h1 className="text-styleswap-text text-2xl font-black uppercase tracking-tighter">Your Looks</h1>
          </div>
        </div>
        <div className="bg-[#ffde59] border-4 border-black px-3 py-1 shadow-neo-sm">
          <p className="text-black font-black text-sm uppercase">{doneCount}/{totalCount} Ready</p>
        </div>
      </header>

      {/* Progress bar */}
      {!allDone && (
        <div className="px-5 pt-4">
          <div className="w-full bg-gray-200 border-4 border-black h-4 shadow-neo-sm">
            <div
              className="bg-styleswap-accent h-full transition-all duration-500"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-black font-black text-xs uppercase mt-2 text-center">
            Generating {totalCount - doneCount} more look{totalCount - doneCount > 1 ? 's' : ''}...
          </p>
        </div>
      )}

      {/* Thumbnail strip */}
      <div className="px-4 pt-4 flex gap-3 overflow-x-auto scrollbar-none">
        {results.map((r, i) => (
          <button
            key={r.code}
            onClick={() => setActiveIdx(i)}
            className={`flex-shrink-0 w-20 h-24 border-4 border-black overflow-hidden transition-all shadow-neo-sm ${
              activeIdx === i ? 'ring-4 ring-offset-2 ring-black' : ''
            }`}
          >
            {r.status === 'done' && r.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image_url} alt={`Look ${i + 1}`} className="w-full h-full object-cover" />
            ) : r.status === 'polling' ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-black border-t-styleswap-accent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="w-full h-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Main result display */}
      <div className="flex-1 px-4 py-6 flex flex-col items-center gap-4">
        {results[activeIdx]?.status === 'done' && results[activeIdx].image_url ? (
          <>
            <div className="w-full max-w-md border-4 border-black shadow-neo overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={results[activeIdx].image_url!}
                alt={`Look ${activeIdx + 1}`}
                className="w-full object-contain max-h-[60vh]"
              />
            </div>
            <p className="text-black font-black text-sm uppercase bg-[#ffde59] border-4 border-black px-4 py-2 shadow-neo-sm">
              Look {activeIdx + 1} of {totalCount}
            </p>
          </>
        ) : results[activeIdx]?.status === 'error' ? (
          <div className="w-full max-w-md border-4 border-black shadow-neo bg-red-100 flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-black font-black text-lg uppercase">Generation failed</p>
            <p className="text-black/70 font-bold text-sm">This look could not be generated</p>
          </div>
        ) : (
          <div className="w-full max-w-md border-4 border-black shadow-neo bg-gray-100 flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-8 border-black border-t-styleswap-accent rounded-full animate-spin" />
            <p className="text-black font-black text-lg uppercase animate-pulse">Generating Look {activeIdx + 1}...</p>
          </div>
        )}

        {/* Navigation arrows */}
        {totalCount > 1 && (
          <div className="flex gap-4">
            <button
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="w-14 h-14 border-4 border-black shadow-neo-sm flex items-center justify-center bg-white disabled:opacity-30 hover:-translate-y-0.5 hover:shadow-neo transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActiveIdx((i) => Math.min(totalCount - 1, i + 1))}
              disabled={activeIdx === totalCount - 1}
              className="w-14 h-14 border-4 border-black shadow-neo-sm flex items-center justify-center bg-white disabled:opacity-30 hover:-translate-y-0.5 hover:shadow-neo transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Try again */}
        <Link
          href={`/shop/${params.slug}`}
          className="mt-4 w-full max-w-md flex items-center justify-center gap-2 bg-white border-4 border-black text-black font-black uppercase py-4 shadow-neo hover:bg-styleswap-accent hover:-translate-y-1 hover:shadow-neo-lg transition-all"
        >
          ← Browse More Outfits
        </Link>
      </div>
    </div>
  );
}
