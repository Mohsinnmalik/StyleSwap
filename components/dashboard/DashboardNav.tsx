'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const NAV_LINKS = [
  { href: '/dashboard',          label: 'Overview',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/products', label: 'Products',  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/dashboard/shop',     label: 'Shop & QR', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
];

interface DashboardNavProps {
  user: { name?: string | null; email?: string | null };
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <header className="bg-[#ffde59] border-b-4 border-black sticky top-0 z-50 shadow-neo-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white border-4 border-black rounded-neo flex items-center justify-center shadow-neo-sm">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-black font-black text-xl uppercase tracking-tighter hidden sm:block mt-1">StyleSwap</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-neo text-sm font-black uppercase tracking-wider transition-all duration-150 border-2 ${
                    active
                      ? 'bg-white border-black text-black shadow-neo-sm'
                      : 'border-transparent text-black hover:border-black hover:bg-white hover:shadow-neo-sm'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={icon} />
                  </svg>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-black font-bold text-sm hidden sm:block truncate max-w-[180px] bg-white border-2 border-black px-2 py-0.5 shadow-neo-sm">
            {user.name ?? user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-10 h-10 flex items-center justify-center rounded-neo bg-white border-2 border-black text-black shadow-neo-sm hover:shadow-neo active:translate-y-0.5 active:shadow-none transition-all"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex border-t-4 border-black bg-white">
        {NAV_LINKS.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-black uppercase tracking-wider border-x border-black transition-colors ${
                active ? 'bg-styleswap-accent text-black border-b-4 border-b-black' : 'text-black hover:bg-[#f0f0f0]'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={icon} />
              </svg>
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
