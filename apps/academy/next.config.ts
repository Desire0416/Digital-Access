import type { NextConfig } from "next";
import path from "node:path";
import { config as loadEnv } from "dotenv";

// Source de vérité unique : le .env du monorepo (racine) est chargé pour l'app.
loadEnv({ path: "../../.env" });

// Racine du monorepo, calculée depuis l'emplacement STABLE de ce fichier de
// config (apps/academy) — pas depuis process.cwd() (instable dans les workers
// de build de Next). Sans cela, Next détecte comme racine un package.json
// résiduel dans C:\Users\… et scanne tout le home (EPERM sur la jonction).
const monorepoRoot = path.resolve(__dirname, "..", "..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@da/ui", "@da/config", "@da/email"],
  // Le client Prisma dédié + @react-pdf sont chargés en modules Node natifs
  // (jamais bundlés par webpack) — sinon le require dynamique du moteur Prisma
  // provoque un context-glob qui casse le build sous Windows.
  serverExternalPackages: ["@react-pdf/renderer", "@da/academy-db"],
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
  // Force le client Prisma dédié à rester un require Node au runtime (jamais
  // bundlé) — évite que webpack analyse le moteur (27 Mo) et déclenche un
  // context-glob qui scanne le home Windows (EPERM sur la jonction).
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean);
      externals.unshift(({ request }: { request?: string }, cb: (err?: unknown, result?: string) => void) => {
        if (request && (request.startsWith("@da/academy-db") || request.includes("academy-db/generated"))) {
          return cb(undefined, "commonjs " + request);
        }
        cb();
      });
      config.externals = externals;
    }
    return config;
  },
};

export default nextConfig;
