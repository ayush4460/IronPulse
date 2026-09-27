import type { Metadata, Viewport } from 'next';
import './globals.css';
import { WorkoutProvider } from '@/context/WorkoutContext';
import Navigation from '@/components/Navigation';
import ActiveWorkoutModal from '@/components/ActiveWorkoutModal';
import ActiveWorkoutBar from '@/components/ActiveWorkoutBar';
import RestTimerFloating from '@/components/RestTimerFloating';

export const metadata: Metadata = {
  title: 'IronPulse - Gym & Workout Tracker PWA',
  description:
    'Track gym sets, routines, rest timers, and personal records with an elite Hevy-inspired interface.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IronPulse',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#080c14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-slate-950 text-slate-100">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-300">
        <WorkoutProvider>
          {/* Main App Layout */}
          <div className="flex min-h-screen flex-col">
            <Navigation />

            {/* Content Area (offset left by 64 (16rem) on desktop) */}
            <main className="flex-1 md:pl-64 pb-24 md:pb-8">{children}</main>

            {/* Overlays */}
            <ActiveWorkoutBar />
            <ActiveWorkoutModal />
            <RestTimerFloating />
          </div>
        </WorkoutProvider>
      </body>
    </html>
  );
}
