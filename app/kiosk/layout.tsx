import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Tryonity — Kiosk Display' };
export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
