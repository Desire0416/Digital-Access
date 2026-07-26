import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${siteConfig.name} — Apprenez une compétence, préparez-vous à un métier`,
    short_name: "Academy",
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F0F1A",
    theme_color: "#1A1A2E",
    lang: "fr",
    dir: "ltr",
    categories: ["education", "productivity"],
    shortcuts: [
      { name: "Catalogue des formations", short_name: "Formations", url: "/formations" },
      { name: "Mon espace", short_name: "Espace", url: "/espace" },
      { name: "Mes cohortes", short_name: "Cohortes", url: "/espace/cohortes" },
    ],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
