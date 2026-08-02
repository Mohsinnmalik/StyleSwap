'use client';

// This page accepts ?codes=code1,code2,code3 and shows all results side by side.
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';

interface ResultItem {
  code:      string;
  status:    'polling' | 'done' | 'error';
  image_url: string | null;
}

function SessionMultiContent() {
  const params      = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const codesParam  = searchParams.get('codes') ?? '';
  const codes       = codesParam.split(',').filter(Boolean);

  const [results, setResults] = useState<ResultItem[]>(
    codes.map((c) => ({ code: c, status: 'polling', image_url: null }))
  );
  const [activeIdx, setActiveIdx] = useState(0);

  // Ref mirror so pollAll always sees the latest results without re-creating
  // the interval (stale-closure fix)
  const resultsRef = useRef(results);
  useEffect(() => { resultsRef.current = results; }, [results]);

  const pollAll = useCallback(async () => {
    const updated = await Promise.all(
      resultsRef.current.map(async (item) => {
        if (item.status === 'done' || item.status === 'error') return item;
        try {
          const res  = await fetch(`/api/tryon/session?code=${encodeURIComponent(item.code)}`);
          const data = await res.json();
          if (data.status === 'done' && data.image_url) {
            return { ...item, status: 'done' as const, image_url: data.image_url };
          } else if (data.status === 'expired' || data.status === 'not_found' || data.status === 'error') {
            return { ...item, status: 'error' as const };
          }
          return item;
        } catch {
          return item; // keep last known state on transient failures
        }
      })
    );
    setResults(updated);
  }, []);

  const allSettled = results.length > 0 && results.every((r) => r.status !== 'polling');

  useEffect(() => {
    if (codes.length === 0 || allSettled) return;
    pollAll();
    const interval = setInterval(pollAll, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codesParam, allSettled, pollAll]);

  const doneCount    = results.filter((r) => r.status === 'done').length;
  const totalCount   = results.length;
  const allDone      = doneCount === totalCount;

  if (codes.length === 0) {
    return (
      <div className="min-h-screen bg-[#070708] flex items-center justify-center">
        <p className="text-white font-mono text-xs uppercase tracking-widest">No session codes found.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white font-sans selection:bg-white/30 flex flex-col relative overflow-x-hidden"
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

      {/* Header */}
      <header
        className="sticky top-0 z-20 px-8 py-6 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-10"
        style={{
          background: 'rgba(7, 7, 8, 0.45)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center gap-4">
          <Link href={`/shop/${params.slug}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white hover:border-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-white/40 block">Haute Couture Studio</span>
            <h1 className="font-serif text-2xl font-light uppercase tracking-[0.15em] text-[#fdfbf7]">
              Your <span className="italic font-serif">Looks</span>
            </h1>
          </div>
        </div>
        <div className="bg-white/5 border border-white/12 px-4 py-1.5 rounded-full inline-block">
          <p className="text-white font-mono text-[10px] uppercase tracking-widest">{doneCount}/{totalCount} Ready</p>
        </div>
      </header>

      {/* Progress bar */}
      {!allDone && (
        <div className="max-w-xl mx-auto w-full px-8 pt-6 z-10">
          <div className="w-full bg-white/5 border border-white/10 h-2.5 rounded-full overflow-hidden shadow-inner">
            <div
              className="bg-white h-full transition-all duration-500 rounded-full"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-white/40 font-mono text-[9px] uppercase tracking-widest mt-2.5 text-center">
            Generating {totalCount - doneCount} more look{totalCount - doneCount > 1 ? 's' : ''}...
          </p>
        </div>
      )}

      {/* Thumbnail strip */}
      <div className="max-w-xl mx-auto w-full px-8 pt-6 flex gap-3 overflow-x-auto scrollbar-none z-10">
        {results.map((r, i) => (
          <button
            key={r.code}
            onClick={() => setActiveIdx(i)}
            className={`flex-shrink-0 w-20 h-24 rounded-2xl overflow-hidden border transition-all shadow-md cursor-pointer ${
              activeIdx === i ? 'border-white ring-4 ring-white/10 scale-102' : 'border-white/10 opacity-60 hover:opacity-100'
            }`}
            style={{ background: 'rgba(255, 255, 255, 0.03)' }}
          >
            {r.status === 'done' && r.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image_url} alt={`Look ${i + 1}`} className="w-full h-full object-cover" />
            ) : r.status === 'polling' ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="w-full h-full bg-red-950/20 flex items-center justify-center text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Main result display */}
      <div className="flex-1 px-8 py-6 flex flex-col items-center gap-6 z-10">
        {results[activeIdx]?.status === 'done' && results[activeIdx].image_url ? (
          <>
            <div className="w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/8 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={results[activeIdx].image_url!}
                alt={`Look ${activeIdx + 1}`}
                className="w-full object-contain max-h-[60vh] rounded-[2.5rem]"
              />
            </div>
            <p className="text-white text-[10px] font-mono uppercase tracking-[0.25em] bg-white/5 border border-white/12 px-5 py-2 rounded-full shadow-md">
              Look {activeIdx + 1} of {totalCount}
            </p>
          </>
        ) : results[activeIdx]?.status === 'error' ? (
          <div className="w-full max-w-md rounded-[2.5rem] border border-white/8 bg-red-950/5 flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-red-500 font-serif text-lg uppercase tracking-widest font-light">Generation failed</p>
            <p className="text-white/40 font-mono text-[9px] uppercase tracking-wider">This look could not be generated</p>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-[2.5rem] border border-white/8 bg-white/3 flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-mono text-[10px] uppercase tracking-[0.25em] animate-pulse">Generating Look {activeIdx + 1}...</p>
          </div>
        )}

        {/* Navigation arrows */}
        {totalCount > 1 && (
          <div className="flex gap-4">
            <button
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="w-14 h-14 border border-white/15 rounded-full flex items-center justify-center bg-white/3 hover:bg-white hover:text-black transition-all disabled:opacity-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActiveIdx((i) => Math.min(totalCount - 1, i + 1))}
              disabled={activeIdx === totalCount - 1}
              className="w-14 h-14 border border-white/15 rounded-full flex items-center justify-center bg-white/3 hover:bg-white hover:text-black transition-all disabled:opacity-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Try again */}
        <Link
          href={`/shop/${params.slug}`}
          className="w-full max-w-md py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-white/20 text-white hover:bg-white/10 text-center transition-all duration-300"
        >
          ← Browse More Outfits
        </Link>
      </div>
    </div>
  );
}

export default function SessionMultiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    }>
      <SessionMultiContent />
    </Suspense>
  );
}
