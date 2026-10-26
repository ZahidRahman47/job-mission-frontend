import type { Metadata, Viewport } from 'next';
import { Archivo, Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { Providers } from './providers';

// Three roles, never more: display (headlines), UI (everything else), data (dates, numbers).
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-face', display: 'swap' });

const DESCRIPTION =
  'Free job-application tracker for Pakistan. LinkedIn and Indeed applications tracked straight from your Gmail, with a reminder to follow up.';

export const metadata: Metadata = {
  // Share previews (LinkedIn, WhatsApp, X) need absolute image URLs.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://job-mission-frontend.vercel.app',
  ),
  title: { default: 'Mission Control', template: '%s · Mission Control' },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Mission Control',
    title: 'Every job you apply to. Tracked for you.',
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f0c' },
  ],
};

// Applies the saved theme before first paint, so dark-mode users never see a light flash.
const themeScript = `try{var t=localStorage.getItem('mc-theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
