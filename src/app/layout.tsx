// ────────────────────────────────────────────────────────────────
// layout.tsx — корневой layout Next.js.
// Содержит viewport-настройки под mobile-first (ТЗ §13).
// ────────────────────────────────────────────────────────────────

import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Ashbound: Base Survivors',
  description: 'Mobile-first pixel RPG survivor roguelite on Base.',
  other: {
    'base:app_id': '6a144c85ed0edcf2e9a876fb',
  },
};

// Next.js сам ставит мета-тег viewport из этого объекта.
// maximumScale=1 + userScalable=false — запрет зума на телефоне (ТЗ §13).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0c14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0c14] text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
