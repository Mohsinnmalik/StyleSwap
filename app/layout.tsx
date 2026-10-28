import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Tryonity — Neural Fitting', template: '%s | Tryonity' },
  description: 'The future of virtual haute couture and personal styling.',
  keywords: ['virtual try-on', 'AI fashion', 'clothing', 'showroom'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-black text-white selection:bg-white/30">{children}</body>
    </html>
  );
}
