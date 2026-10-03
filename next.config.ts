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
};

export default nextConfig;
