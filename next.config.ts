import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  experimental: {
    serverActions: {
      // Il caricamento avatar può arrivare a 2 MB; il limite di default è 1 MB.
      bodySizeLimit: "3mb",
    },
  },
  /**
   * Favicon e icone PWA hanno nome fisso (niente hash nel path), quindi il
   * browser se le tiene in cache per giorni: dopo un cambio di marchio l'utente
   * continua a vedere la versione vecchia. Le facciamo rivalidare sempre.
   * I file sono < 20 kB: il costo di una richiesta è trascurabile.
   */
  async headers() {
    const revalidate = [
      { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
    ];

    return [
      { source: "/icon.svg", headers: revalidate },
      { source: "/icon-maskable.svg", headers: revalidate },
      { source: "/manifest.webmanifest", headers: revalidate },
      { source: "/icons/:file*", headers: revalidate },
    ];
  },
};

export default nextConfig;
