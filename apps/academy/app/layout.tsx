import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { auth } from "@da/auth";
import { academyConfig } from "@/lib/site";
import { Providers } from "@/components/Providers";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

// Rendu dynamique de toutes les pages (aucune génération statique / ISR).
export const dynamic = "force-dynamic";

/* ─────────────── Données structurées SEO (Schema.org) ─────────────── */
const academySchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${academyConfig.url}/#organization`,
  name: academyConfig.name,
  url: academyConfig.url,
  logo: `${academyConfig.url}/icon.svg`,
  description: academyConfig.description,
  email: academyConfig.contact.email,
  inLanguage: "fr-CI",
  parentOrganization: {
    "@type": "Organization",
    name: "Digital Access",
    url: "https://digitalaccess.ci",
  },
  areaServed: { "@type": "Country", name: "Côte d'Ivoire" },
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
  metadataBase: new URL(academyConfig.url),
  title: {
    default: `${academyConfig.name} — ${academyConfig.tagline}`,
    template: `%s — ${academyConfig.name}`,
  },
  description: academyConfig.description,
  keywords: [
    "formation en ligne Côte d'Ivoire",
    "e-learning Abidjan",
    "cours développement web",
    "formation marketing digital",
    "certificat en ligne",
    "Access Academy",
  ],
  authors: [{ name: "Digital Access" }],
  openGraph: {
    type: "website",
    locale: academyConfig.locale,
    url: academyConfig.url,
    siteName: academyConfig.name,
    title: `${academyConfig.name} — ${academyConfig.tagline}`,
    description: academyConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: academyConfig.name,
    description: academyConfig.description,
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

  return (
    <html
      lang="fr"
      className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-surface-primary antialiased">
        <JsonLd data={academySchema} />
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
        >
          Aller au contenu
        </a>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
