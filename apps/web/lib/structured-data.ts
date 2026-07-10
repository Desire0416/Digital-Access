import { siteConfig } from "./site";
import { absoluteUrl } from "./seo";

/**
 * Fabriques de données structurées Schema.org (JSON-LD).
 * Injectées via le composant <JsonLd data={...} />.
 * L'identité de l'entreprise (LocalBusiness) porte @id "#organization" pour être
 * référencée par les autres schémas (publisher d'article, breadcrumb, etc.).
 */

const ORG_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;
const LOGO = `${siteConfig.url}/icon-512.png`;

/** Adresse postale réutilisable. */
const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: siteConfig.contact.street,
  addressLocality: siteConfig.contact.addressLocality,
  addressRegion: siteConfig.contact.addressRegion,
  addressCountry: siteConfig.contact.addressCountry,
};

/**
 * Entreprise locale (ProfessionalService ⊂ LocalBusiness). Nom, logo, description,
 * coordonnées (2 numéros via contactPoint), réseaux sociaux, zone desservie et
 * activité. C'est le schéma que Google utilise pour le panneau de connaissances /
 * le logo dans les résultats.
 */
export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  "@id": ORG_ID,
  name: siteConfig.name,
  alternateName: "Digital Access CI",
  legalName: "Digital Access",
  url: siteConfig.url,
  logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 },
  image: LOGO,
  description: siteConfig.description,
  slogan: siteConfig.tagline,
  email: siteConfig.contact.email,
  telephone: siteConfig.contact.phone,
  priceRange: "À partir de 150 000 FCFA",
  currenciesAccepted: "XOF",
  paymentAccepted: "Mobile Money (Orange, MTN, Wave), Virement, Espèces",
  address: postalAddress,
  contactPoint: siteConfig.contact.phones.map((tel) => ({
    "@type": "ContactPoint",
    telephone: tel,
    contactType: "customer service",
    areaServed: "CI",
    availableLanguage: ["French"],
  })),
  sameAs: Object.values(siteConfig.socials),
  areaServed: [
    { "@type": "City", name: "Abidjan" },
    { "@type": "Country", name: "Côte d'Ivoire" },
  ],
  knowsAbout: [
    "Création de site web",
    "Refonte de site web",
    "Applications web",
    "Plateformes e-learning",
    "Maintenance de site web",
    "Sites pour établissements scolaires",
    "Référencement (SEO)",
  ],
};

/** Le site web lui-même (permet la SearchAction / sitelinks). */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: siteConfig.name,
  url: siteConfig.url,
  inLanguage: "fr-CI",
  publisher: { "@id": ORG_ID },
};

export interface Crumb {
  name: string;
  /** Chemin relatif ("/services") ou URL absolue. */
  path: string;
}

/** Fil d'Ariane structuré (BreadcrumbList). Le dernier élément est la page courante. */
export function breadcrumbSchema(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Page FAQ structurée (FAQPage) — éligible aux résultats enrichis Google. */
export function faqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export interface ServiceSchemaInput {
  name: string;
  description: string;
  /** Chemin de la page du service ("/services/creation-site-web"). */
  path: string;
  serviceType?: string;
  /** Prix de départ en FCFA (Offer). */
  priceFrom?: number;
}

/** Un service précis (Service) rattaché à l'entreprise, avec zone desservie et offre. */
export function serviceSchema({ name, description, path, serviceType, priceFrom }: ServiceSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType: serviceType ?? name,
    url: absoluteUrl(path),
    provider: { "@id": ORG_ID },
    areaServed: [
      { "@type": "City", name: "Abidjan" },
      { "@type": "Country", name: "Côte d'Ivoire" },
    ],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: absoluteUrl(path),
      servicePhone: siteConfig.contact.phone,
    },
    ...(priceFrom
      ? {
          offers: {
            "@type": "Offer",
            price: priceFrom,
            priceCurrency: "XOF",
            url: absoluteUrl("/devis"),
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export interface CatalogOffer {
  name: string;
  description: string;
  price: number;
  slug: string;
}

/** Catalogue d'offres (OfferCatalog) pour la page /services ou /tarifs. */
export function offerCatalogSchema(name: string, offers: CatalogOffer[]) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name,
    provider: { "@id": ORG_ID },
    itemListElement: offers.map((o) => ({
      "@type": "Offer",
      name: o.name,
      description: o.description,
      price: o.price,
      priceCurrency: "XOF",
      url: absoluteUrl(`/services#${o.slug}`),
    })),
  };
}

/** WebPage générique reliée au site (utile pour les pages sans schéma spécifique). */
export function webPageSchema(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: "fr-CI",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
  };
}
