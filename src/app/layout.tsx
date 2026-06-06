import type { Metadata, Viewport } from 'next';
import { Poppins, Lora } from 'next/font/google';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['600', '700'],
});

import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'Mytify — Music Streaming',
  description: 'Personal music streaming powered by YouTube. Search, play, and manage your favorite songs.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mytify',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1db954',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.variable} ${lora.variable} antialiased`}>
        <TooltipProvider>
          <ServiceWorkerRegistration />
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
