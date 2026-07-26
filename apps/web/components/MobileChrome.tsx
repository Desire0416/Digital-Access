"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  FolderKanban,
  Tag,
  Mail,
  LayoutDashboard,
  FileText,
  Wrench,
  LifeBuoy,
} from "lucide-react";
import { MobileTabBar, InstallPrompt, type MobileTab } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille mobile du site (apps/web) — barre d'onglets basse façon application
   + invite d'installation PWA. Montée une seule fois dans le layout racine,
   rendue via portail (jamais sous un parent transformé) et masquée en desktop
   (`lg:hidden`) ainsi que sur le back-office et l'authentification.
   Les onglets s'adaptent au rôle (visiteur vs client).
   ══════════════════════════════════════════════════════════════════════════ */

const VISITOR_TABS: MobileTab[] = [
  { key: "home", label: "Accueil", href: "/", icon: Home },
  { key: "services", label: "Services", href: "/services", icon: LayoutGrid },
  { key: "portfolio", label: "Réalisations", href: "/portfolio", icon: FolderKanban },
  { key: "tarifs", label: "Tarifs", href: "/tarifs", icon: Tag },
  { key: "contact", label: "Contact", href: "/contact", icon: Mail },
];

const CLIENT_TABS: MobileTab[] = [
  { key: "espace", label: "Espace", href: "/mon-espace", icon: LayoutDashboard },
  { key: "projets", label: "Projets", href: "/mes-projets", icon: FolderKanban },
  { key: "factures", label: "Factures", href: "/factures", icon: FileText },
  { key: "maintenance", label: "Maintenance", href: "/maintenance", icon: Wrench },
  { key: "support", label: "Support", href: "/support", icon: LifeBuoy },
];

/** Contextes plein écran / à coque propre : pas de barre d'onglets. */
const HIDDEN_PREFIXES = ["/admin", "/auth"];

export function MobileChrome({ initialUser }: { initialUser: { roles?: string[] } | null }) {
  const pathname = usePathname() ?? "/";
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isClient = (initialUser?.roles ?? []).includes("CLIENT");
  const tabs = isClient ? CLIENT_TABS : VISITOR_TABS;

  // Réserve d'espace bas (< lg) via une classe sur <body>, seulement si visible.
  React.useEffect(() => {
    if (hidden) {
      document.body.classList.remove("has-mobile-tabbar");
      return;
    }
    document.body.classList.add("has-mobile-tabbar");
    return () => document.body.classList.remove("has-mobile-tabbar");
  }, [hidden]);

  if (!mounted || hidden) return null;

  return createPortal(
    <div className="lg:hidden">
      {/* Placée au-dessus du FAB assistant (h-14 à ~4.75rem du bas). */}
      <InstallPrompt
        appName="Digital Access"
        tagline="Vos projets et factures à portée de main."
        className="bottom-[calc(8.5rem+env(safe-area-inset-bottom))]"
      />
      <MobileTabBar tabs={tabs} pathname={pathname} indicatorId="web-tab-active" />
    </div>,
    document.body,
  );
}
