import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'StyleSwap — Virtual Try-On', template: '%s | StyleSwap' },
  description: 'AI-powered virtual try-on for clothing showrooms. See how any outfit looks on you before buying.',
  keywords: ['virtual try-on', 'AI fashion', 'clothing', 'showroom'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-styleswap-bg text-styleswap-text antialiased">{children}</body>
    </html>
  );
}
