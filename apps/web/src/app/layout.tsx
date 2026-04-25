import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister';
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
    shortcut: '/favicon.ico',
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
    // suppressHydrationWarning: the anti-FOUC script mutates className/style before
    // React hydrates, causing a mismatch that is intentional and safe to suppress.
    <html lang="es" suppressHydrationWarning>
      <head>
        {/*
          Anti-FOUC: runs synchronously before first paint.
          Reads persisted preferences from localStorage and applies
          theme class, accent CSS vars, and font-size BEFORE React hydrates.
          dangerouslySetInnerHTML is safe here — no user data, fully static script.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var ACCENT={
    indigo: ['129 140 248','99 102 241','79 70 229'],
    emerald:['52 211 153','16 185 129','5 150 105'],
    rose:   ['251 113 133','244 63 94','225 29 72'],
    amber:  ['251 191 36','245 158 11','217 119 6'],
    violet: ['167 139 250','139 92 246','124 58 237']
  };
  var p={theme:'dark',accentColor:'indigo',fontSize:'normal'};
  try{
    var raw=localStorage.getItem('senatic-preferences');
    if(raw){
      var stored=JSON.parse(raw);
      var prefs=stored&&stored.state&&stored.state.preferences;
      if(prefs){
        if(prefs.theme)       p.theme=prefs.theme;
        if(prefs.accentColor) p.accentColor=prefs.accentColor;
        if(prefs.fontSize)    p.fontSize=prefs.fontSize;
      }
    }
  }catch(e){}
  var h=document.documentElement;
  if(p.theme==='dark')      h.classList.add('dark');
  else if(p.theme==='light')h.classList.remove('dark');
  else if(window.matchMedia('(prefers-color-scheme: dark)').matches)h.classList.add('dark');
  var s=ACCENT[p.accentColor]||ACCENT.indigo;
  h.style.setProperty('--color-primary-400',s[0]);
  h.style.setProperty('--color-primary-500',s[1]);
  h.style.setProperty('--color-primary-600',s[2]);
  h.style.fontSize=p.fontSize==='large'?'18px':'16px';
})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
