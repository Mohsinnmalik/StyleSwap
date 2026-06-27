'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, shopName }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setLoading(false);
      setError('Failed to connect to the server. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-styleswap-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Brand mark */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-styleswap-accent border-4 border-black rounded-neo flex items-center justify-center shadow-neo-sm">
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span className="text-black text-3xl font-black tracking-tighter uppercase">StyleSwap</span>
      </div>

      {/* Signup card */}
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-8 border-b-4 border-black pb-4">
            <h1 className="text-black text-3xl font-black mb-1 uppercase tracking-tight">Create Account</h1>
            <p className="text-styleswap-subtle text-sm font-bold">Register your showroom to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input-field"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="input-field"
              />
            </div>

            {/* Shop Name */}
            <div>
              <label htmlFor="shopName" className="label">Showroom / Shop Name</label>
              <input
                id="shopName"
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Elegant Couture"
                className="input-field"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-black font-bold text-sm bg-styleswap-error border-4 border-black shadow-neo-sm px-4 py-3">
                <svg className="w-5 h-5 flex-shrink-0 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 text-black font-bold text-sm bg-[#00cc00] border-4 border-black shadow-neo-sm px-4 py-3">
                <svg className="w-5 h-5 flex-shrink-0 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary mt-1"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-4 border-black/30 border-t-black rounded-full animate-spin" />
                  Wait...
                </>
              ) : 'Register'}
            </button>
          </form>
        </div>

        {/* Back to Login Link */}
        <div className="flex justify-center w-full">
          <p className="text-center text-black font-bold text-sm mt-8 bg-white border-4 border-black shadow-neo-sm py-2 px-4 inline-block">
            Already have an account?{' '}
            <Link href="/login" className="text-styleswap-accent hover:underline font-black uppercase">
              Log in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-black font-black text-xs mt-6 uppercase tracking-widest">
          Powered by <span className="text-styleswap-accent">StyleSwap</span>
        </p>
      </div>
    </div>
  );
}
