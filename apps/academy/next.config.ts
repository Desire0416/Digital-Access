import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";

// Source de vérité unique : le .env du monorepo (racine) est chargé pour l'app.
loadEnv({ path: "../../.env" });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@da/ui", "@da/db", "@da/config", "@da/auth", "@da/email"],
  // @react-pdf/renderer (+ fontkit) doit tourner en module Node natif, jamais bundlé.
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@da/ui"],
  },
};

export default nextConfig;
