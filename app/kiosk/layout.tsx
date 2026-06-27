import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'StyleSwap — Kiosk Display' };
export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
