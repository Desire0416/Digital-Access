import type { Metadata } from "next";
import { siteConfig } from "./site";

/** URL absolue à partir d'un chemin relatif ("/services" → "https://digitalaccess.ci/services"). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface BuildMetadataInput {
  /** Titre de la page (le suffixe « — Digital Access » est ajouté par le template racine). */
  title: string;
  /** Meta description unique de la page. */
  description: string;
  /** Chemin canonique de la page, ex. "/services". Sert au canonical ET à og:url. */
  path: string;
  /** Images Open Graph explicites (URLs absolues ou chemins). Prioritaires sur tout le reste. */
  images?: string[];
  /**
   * Si aucune `images` n'est fournie, utilise par défaut l'image OG de marque
   * (`/opengraph-image`, 1200×630) — garantit un aperçu sur WhatsApp / Facebook /
   * LinkedIn sur TOUTES les pages statiques. Mettre `false` sur les pages qui ont
   * leur propre fichier `opengraph-image.tsx` de segment (blog/[slug], portfolio/[slug]).
   */
  ogImageFallback?: boolean;
  /** Type Open Graph. "article" pour le blog. */
  type?: "website" | "article";
  /** Empêche l'indexation (pages auth, etc.). */
  noindex?: boolean;
  /** Mots-clés spécifiques à la page. */
  keywords?: string[];
  /** Date de publication ISO (articles). */
  publishedTime?: string;
  /** Date de modification ISO (articles). */
  modifiedTime?: string;
  /** Auteurs (articles). */
  authors?: string[];
}

/**
 * Fabrique un objet Metadata Next.js cohérent pour toute page publique :
 * titre + description uniques, URL canonique, Open Graph complet (WhatsApp /
 * Facebook / LinkedIn) et Twitter Card. Centralise les règles SEO afin que
 * chaque page n'ait qu'à fournir titre / description / chemin.
 */
export function buildMetadata({
  title,
  description,
  path,
  images,
  ogImageFallback = true,
  type = "website",
  noindex,
  keywords,
  publishedTime,
  modifiedTime,
  authors,
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);
  // Image OG : explicite → défaut de marque (/opengraph-image) → laissée au fichier de segment.
  const resolvedImages = images ?? (ogImageFallback ? [absoluteUrl("/opengraph-image")] : undefined);
  const ogImages = resolvedImages?.map((src) => (/^https?:\/\//.test(src) ? src : absoluteUrl(src)));

  return {
    title,
    description,
    ...(keywords && keywords.length ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title,
      description,
      ...(ogImages ? { images: ogImages } : {}),
      ...(type === "article"
        ? {
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(authors ? { authors } : {}),
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImages ? { images: ogImages } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
