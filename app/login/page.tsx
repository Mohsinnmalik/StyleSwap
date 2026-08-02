'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Please verify your email and passcode.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Failed to connect to the boutique server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden select-none"
      style={{ background: '#070708' }} // Pure landing page obsidian black
    >
      {/* ── BACKGROUND LAYER 1: Grayscale fashion editorial backdrop ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2564&auto=format&fit=crop')",
          backgroundPosition: 'center 20%',
          backgroundSize: 'cover',
          opacity: 0.22,
          filter: 'grayscale(100%) brightness(40%) contrast(110%) blur(3px)',
        }}
      />

      {/* ── BACKGROUND LAYER 2: Subtle white spotlights ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 55% at 50% -10%, rgba(255, 255, 255, 0.08) 0%, transparent 100%),
            radial-gradient(circle at 10% 30%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── BACKGROUND LAYER 3: Vignette ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            linear-gradient(to bottom,
              rgba(7, 7, 8, 0.05) 0%,
              rgba(7, 7, 8, 0.40) 50%,
              rgba(7, 7, 8, 0.98) 100%
            ),
            radial-gradient(ellipse 135% 100% at 50% 50%,
              transparent 35%,
              rgba(7, 7, 8, 0.75) 100%
            )
          `,
        }}
      />

      {/* ── BACKGROUND LAYER 4: Top hairline sheen ── */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none z-0"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.15) 70%, transparent 100%)',
        }}
      />

      {/* ── BACKGROUND LAYER 5: Dots ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Kiosk Brand Logo (Cinzel Serif matching header) ── */}
      <div className="flex flex-col items-center text-center space-y-2 mb-10 z-10 animate-fade-in">
        <Link
          href="/"
          className="font-serif text-3xl tracking-[0.3em] uppercase font-bold text-[#fdfbf7] hover:opacity-75 transition-all duration-300"
        >
          Tryonity<span className="opacity-55">.</span>
        </Link>
        <span className="block text-[9px] font-mono text-white/40 tracking-[0.35em] uppercase">
          Neural Fitting Platform
        </span>
      </div>

      {/* ── Curved Auth Glass Card ── */}
      <div
        className="w-full max-w-md rounded-[3rem] p-10 z-10 space-y-8 animate-fade-in"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
        }}
      >
        <div className="text-center pb-6 space-y-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-white/40 bg-white/5 border border-white/12 px-4 py-1.5 rounded-full inline-block">
            Management Portal
          </span>
          <h1 className="text-3xl font-light font-serif uppercase tracking-widest text-[#fdfbf7] pt-2">
            Client <span className="italic font-serif">Login</span>
          </h1>
          <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">
            Enter your boutique credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email input */}
          <div className="space-y-2.5">
            <label htmlFor="email" className="text-[9px] font-mono font-semibold tracking-[0.28em] uppercase text-white/45 block px-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="executive@atelier.com"
              className="w-full bg-[#0d0c0e] border border-white/12 rounded-full px-6 py-4 text-white text-sm font-sans tracking-wide placeholder-white/25 outline-none transition-all duration-300 focus:border-white/40 focus:ring-4 focus:ring-white/5"
            />
          </div>

          {/* Password input */}
          <div className="space-y-2.5">
            <label htmlFor="password" className="text-[9px] font-mono font-semibold tracking-[0.28em] uppercase text-white/45 block px-1">
              Secret Passcode
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0d0c0e] border border-white/12 rounded-full px-6 py-4 text-white text-sm font-sans tracking-wide placeholder-white/25 outline-none transition-all duration-300 focus:border-white/40 focus:ring-4 focus:ring-white/5"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-[1.5rem] bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-mono tracking-wider text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full text-xs md:text-sm font-bold uppercase tracking-[0.18em] py-5 rounded-full bg-white/90 text-black hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin border-black/40 border-t-black" />
                Authenticating…
              </>
            ) : (
              'Authenticate Atelier Executive →'
            )}
          </button>
        </form>
      </div>

      {/* Under-Card Link to Sign up */}
      <p className="text-center text-[9px] font-mono tracking-[0.2em] uppercase text-white/40 mt-10 z-10">
        New Showroom Partner?{' '}
        <Link href="/signup" className="text-white hover:text-white/80 underline ml-1.5">
          Register Atelier
        </Link>
      </p>
    </div>
  );
}
