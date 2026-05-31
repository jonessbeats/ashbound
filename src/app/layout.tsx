import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import DebugOverlay from '@/components/DebugOverlay';

export const metadata: Metadata = {
  title: 'Ashbound: Base Survivors',
  description: 'Mobile-first pixel RPG survivor roguelite on Base.',
  other: {
    'base:app_id': '6a144c85ed0edcf2e9a876fb',
    'talentapp:project_verification': 'd875b0033aedda75860f2ccde543ae6e518381014ca7235f06990afa8efe7174ea967180a13e43682d2f607467c3d238c2e46313dcabe4e67c59fdf95b53edff',
  },
};

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
        <DebugOverlay />
      </body>
    </html>
  );
}
