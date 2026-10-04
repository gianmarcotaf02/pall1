import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/instrument-sans";
import "./globals.css";

const DESCRIPTION = "Partite, squadre, risultati e statistiche del nostro calcetto.";

/** Righe di presentazione quando il link viene condiviso (WhatsApp, Telegram, X…). */
const SHARE_TITLE = "Pall1 — calcetto tra amici";

/**
 * URL pubblico del sito. Serve a rendere assoluti i link che i crawler leggono
 * fuori dal browser (`og:image`): sono gli stessi di `appBaseUrl()` in
 * `lib/telegram.ts`, con in più il ripiego sulle variabili di Vercel, così una
 * preview deploy non annuncia `localhost`.
 */
function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return /^https?:\/\//.test(configured) ? configured : `https://${configured}`;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Pall1", template: "%s · Pall1" },
  description: DESCRIPTION,
  applicationName: "Pall1",
  manifest: "/manifest.webmanifest",
  /*
   * Le icone non sono elencate qui: favicon, `apple-touch-icon` e immagine di
   * condivisione arrivano dalle convenzioni di `src/app/` (`icon.svg`,
   * `favicon.ico`, `apple-icon.png`, `opengraph-image.png`), generate da
   * `npm run build:brand`. Nascono tutte dallo stesso marchio che l'app disegna
   * in alto a sinistra, quindi non possono divergere.
   */
  openGraph: {
    type: "website",
    siteName: "Pall1",
    locale: "it_IT",
    title: SHARE_TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef6ef" },
    { media: "(prefers-color-scheme: dark)", color: "#09110a" },
  ],
};

// Applica il tema prima del paint per evitare il flash.
const themeScript = `(function(){try{var s=localStorage.getItem("pall1-theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;if(s==="dark"||(!s&&d)){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
