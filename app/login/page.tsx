'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

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

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password. Please try again.');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-styleswap-bg flex flex-col items-center justify-center px-4">
      {/* Brand mark */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-styleswap-accent border-4 border-black rounded-neo flex items-center justify-center shadow-neo-sm">
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span className="text-black text-3xl font-black tracking-tighter uppercase">StyleSwap</span>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="mb-8 border-b-4 border-black pb-4">
            <h1 className="text-black text-3xl font-black mb-1 uppercase tracking-tight">Owner Login</h1>
            <p className="text-styleswap-subtle text-sm font-bold">Sign in to manage your shop</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-black font-bold text-sm bg-styleswap-error border-4 border-black shadow-neo-sm px-4 py-3">
                <svg className="w-5 h-5 flex-shrink-0 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary mt-1"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                  Wait...
                </>
              ) : 'Login'}
            </button>
          </form>
        </div>

        {/* Signup Link */}
        <p className="text-center text-black font-bold text-sm mt-8 bg-white border-4 border-black shadow-neo-sm py-2 px-4 inline-block mx-auto">
          Don't have an account?{' '}
          <Link href="/signup" className="text-styleswap-accent hover:underline font-black uppercase">
            Sign up
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center text-black font-black text-xs mt-6 uppercase tracking-widest">
          Powered by <span className="text-styleswap-accent">StyleSwap</span>
        </p>
      </div>
    </div>
  );
}
