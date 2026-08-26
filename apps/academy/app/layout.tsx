import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { siteConfig } from "@/lib/site";
import { currentUser } from "@/lib/guards";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { MobileChrome } from "@/components/MobileChrome";
import { VisitTracker } from "@/components/VisitTracker";
import "./globals.css";

// Plateforme vivante : rendu dynamique (données réelles à chaque requête).
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Apprenez une compétence. Préparez-vous à un métier.`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "formation en ligne Côte d'Ivoire",
    "académie numérique Abidjan",
    "parcours métier",
    "certification professionnelle",
    "e-learning Afrique",
  ],
  openGraph: {
    type: "website",
    locale: "fr_CI",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Académie numérique`,
    description: siteConfig.description,
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Access Academy" },
};

export const viewport: Viewport = {
  themeColor: "#1A1A2E",
  width: "device-width",
  initialScale: 1,
  // Requis pour env(safe-area-inset-*) en mode installé (barre d'onglets mobile).
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Rôle courant (honore l'« agir en tant que ») → onglets adaptés de la coquille
  // mobile. Le layout racine est déjà `force-dynamic`, aucun coût statique perdu.
  const user = await currentUser();

  return (
    <html lang="fr" className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-surface-primary font-sans text-text-primary antialiased">
        <ImpersonationBanner />
        {children}
        <MobileChrome roles={user?.roles ?? []} authed={!!user} />
        <VisitTracker />
      </body>
    </html>
  );
}
