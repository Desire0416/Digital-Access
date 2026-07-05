import type { MetadataRoute } from "next";
import { academyConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${academyConfig.name} — ${academyConfig.tagline}`,
    short_name: academyConfig.name,
    description: academyConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0F0F1A",
    theme_color: "#2B3A8C",
    lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
