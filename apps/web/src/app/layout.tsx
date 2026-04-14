import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aprende-js.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'AprendeJS — SENATIC',
    template: '%s | AprendeJS',
  },
  description: 'Aprende JavaScript desde cero con lecciones interactivas, gamificación y práctica real. Funciona sin internet.',
  manifest: '/manifest.json',
  keywords: ['javascript', 'programación', 'aprender', 'educación', 'SENATIC', 'Colombia', 'secundaria'],
  authors: [{ name: 'SENATIC' }],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: BASE_URL,
    siteName: 'AprendeJS',
    title: 'AprendeJS — Aprende JavaScript gratis',
    description: 'Lecciones interactivas de JavaScript con gamificación. Para estudiantes de secundaria en Colombia.',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'AprendeJS' }],
  },
  twitter: {
    card: 'summary',
    title: 'AprendeJS — SENATIC',
    description: 'Aprende JavaScript desde cero. Gratis, offline y gamificado.',
    images: ['/icons/icon-512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AprendeJS',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
