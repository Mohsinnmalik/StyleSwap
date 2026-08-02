'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const NAV_LINKS = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/products',
    label: 'Inventory',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/dashboard/shop',
    label: 'Atelier',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
];

interface DashboardNavProps {
  user: { name?: string | null; email?: string | null };
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full"
      style={{
        background: 'rgba(7, 7, 8, 0.40)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Brand Logo - Cinzel Luxury */}
        <Link
          href="/dashboard"
          className="font-serif text-xl tracking-[0.25em] uppercase font-bold text-[#fdfbf7] hover:opacity-75 transition-all duration-300 flex-shrink-0"
        >
          Tryonity<span className="opacity-55">.</span>
        </Link>

        {/* Centered Navigation Menu */}
        <nav className="flex items-center justify-center gap-1.5 sm:gap-2">
          {NAV_LINKS.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-mono tracking-[0.15em] uppercase transition-all duration-300 text-[10px] sm:text-xs"
                style={{
                  background: active ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
                  color: active ? '#ffffff' : 'rgba(253, 251, 247, 0.45)',
                  border: active ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid transparent',
                }}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side actions (Kiosk Link & Logout) */}
        <div className="flex items-center gap-3">
          <Link
            href="/kiosk"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[9px] tracking-[0.15em] uppercase text-white/50 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255, 255, 255, 0.12)', background: 'transparent' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth={1.5} />
              <path strokeLinecap="round" strokeWidth={1.5} d="M8 21h8M12 17v4" />
            </svg>
            Kiosk
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300"
            style={{ border: '1px solid rgba(255, 255, 255, 0.12)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
