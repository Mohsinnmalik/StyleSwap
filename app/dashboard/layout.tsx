import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/dashboard/DashboardNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div
      className="min-h-screen text-white relative overflow-x-hidden font-sans select-none"
      style={{ background: '#070708' }} // Deep high-end black
    >
      {/* ── LAYER 1: Grayscale fashion editorial photo (subtle showroom background) ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2564&auto=format&fit=crop')",
          backgroundPosition: 'center 20%',
          backgroundSize: 'cover',
          opacity: 0.22,
          filter: 'grayscale(100%) brightness(50%) contrast(110%) blur(3px)',
        }}
      />

      {/* ── LAYER 2: Ultra-subtle monochrome spotlight glows (no colors, pure class) ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 55% at 50% -10%, rgba(255, 255, 255, 0.08) 0%, transparent 100%),
            radial-gradient(circle at 10% 30%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 90% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── LAYER 3: Vignette to focus attention ── */}
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

      {/* ── LAYER 4: Classy white hairline divider at top edge ── */}
      <div
        className="fixed top-0 left-0 right-0 pointer-events-none z-0"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.15) 70%, transparent 100%)',
        }}
      />

      {/* ── LAYER 5: Luxury paper dot grid texture ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Main container with top padding to prevent top navbar overlap */}
      <div className="relative z-10 flex flex-col min-h-screen pt-24 sm:pt-28 md:pt-32 pb-16">
        <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 md:px-8">
          {children}
        </main>
      </div>

      <DashboardNav user={session.user as { name?: string | null; email?: string | null }} />
    </div>
  );
}
