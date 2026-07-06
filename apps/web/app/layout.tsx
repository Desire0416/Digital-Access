import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { siteConfig } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageTransition } from "@/components/PageTransition";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { ChromeGate } from "@/components/ChromeGate";
import { Providers } from "@/components/Providers";
import { JsonLd } from "@/components/JsonLd";
import { auth } from "@da/auth";
import "./globals.css";

// Rendu dynamique de toutes les pages (aucune génération statique / ISR).
export const dynamic = "force-dynamic";

/* ─────────────── Données structurées SEO (Schema.org) ─────────────── */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteConfig.url}/#organization`,
  name: siteConfig.name,
  alternateName: "Digital Access CI",
  url: siteConfig.url,
  logo: `${siteConfig.url}/icon.svg`,
  description: siteConfig.description,
  email: siteConfig.contact.email,
  telephone: siteConfig.contact.phone,
  sameAs: Object.values(siteConfig.socials),
  address: {
    "@type": "PostalAddress",
    addressLocality: "Abidjan",
    addressCountry: "CI",
  },
  areaServed: { "@type": "Country", name: "Côte d'Ivoire" },
};
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteConfig.url}/#website`,
  name: siteConfig.name,
  url: siteConfig.url,
  inLanguage: "fr-CI",
  publisher: { "@id": `${siteConfig.url}/#organization` },
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "création site web Côte d'Ivoire",
    "agence web Abidjan",
    "site vitrine",
    "e-commerce Mobile Money",
    "plateforme e-learning",
    "développement web Abidjan",
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2B3A8C",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const su = session?.user as
    | { name?: string | null; email?: string | null; roles?: string[] }
    | undefined;
  const initialUser = su
    ? { name: su.name ?? null, email: su.email ?? null, roles: su.roles ?? [] }
    : null;
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-surface-primary antialiased">
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
        >
          Aller au contenu
        </a>
        <Providers session={session}>
          <ChromeGate>
            <SiteHeader initialUser={initialUser} />
          </ChromeGate>
          <main id="contenu">
            <PageTransition>{children}</PageTransition>
          </main>
          <ChromeGate>
            <SiteFooter />
            <WhatsAppFab />
          </ChromeGate>
        </Providers>
      </body>
    </html>
  );
}
