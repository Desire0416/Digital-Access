"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Home,
  LayoutGrid,
  FolderKanban,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Menu as MenuIcon,
  ChevronRight,
  X,
  GraduationCap,
  LogOut,
  UserRound,
} from "lucide-react";
import { MobileTabBar, InstallPrompt, Sheet, cn, type MobileTab } from "@da/ui";
import { siteConfig, mainNav, clientNav } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille mobile du site (apps/web) — barre d'onglets basse (rôle visiteur vs
   client) + onglet « Menu » ouvrant une bottom-sheet (nav complète + compte) +
   invite d'installation. Depuis que la barre couvre la navigation, le hamburger
   de l'en-tête est retiré : le « Menu » le remplace intégralement. Rendue via
   portail, masquée en desktop (lg:hidden) et sur /admin, /auth.
   ══════════════════════════════════════════════════════════════════════════ */

const HIDDEN_PREFIXES = ["/admin", "/auth"];

export function MobileChrome({ initialUser }: { initialUser: { name?: string | null; roles?: string[] } | null }) {
  const pathname = usePathname() ?? "/";
  const [mounted, setMounted] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => setMenuOpen(false), [pathname]);

  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isClient = (initialUser?.roles ?? []).includes("CLIENT");

  React.useEffect(() => {
    if (hidden) {
      document.body.classList.remove("has-mobile-tabbar");
      return;
    }
    document.body.classList.add("has-mobile-tabbar");
    return () => document.body.classList.remove("has-mobile-tabbar");
  }, [hidden]);

  const menuTab: MobileTab = { key: "menu", label: "Menu", icon: MenuIcon, onClick: () => setMenuOpen(true) };
  const tabs: MobileTab[] = isClient
    ? [
        { key: "espace", label: "Espace", href: "/mon-espace", icon: LayoutDashboard },
        { key: "projets", label: "Projets", href: "/mes-projets", icon: FolderKanban },
        { key: "factures", label: "Factures", href: "/factures", icon: FileText },
        { key: "support", label: "Support", href: "/support", icon: LifeBuoy },
        menuTab,
      ]
    : [
        { key: "home", label: "Accueil", href: "/", icon: Home },
        { key: "services", label: "Services", href: "/services", icon: LayoutGrid },
        { key: "portfolio", label: "Réalisations", href: "/portfolio", icon: FolderKanban },
        { key: "devis", label: "Devis", href: "/devis", icon: FileText },
        menuTab,
      ];

  if (!mounted || hidden) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {createPortal(
        <div className="lg:hidden">
          <InstallPrompt
            appName="Digital Access"
            tagline="Vos projets et factures à portée de main."
            className="bottom-[calc(8.5rem+env(safe-area-inset-bottom))]"
          />
          <MobileTabBar tabs={tabs} pathname={pathname} indicatorId="web-tab-active" />
        </div>,
        document.body,
      )}

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} side="bottom" label="Menu de navigation">
        <div className="flex items-center justify-between px-5 pb-3 pt-2">
          <p className="font-display text-base font-bold text-navy">Menu</p>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer"
            className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-2">
          <ul className="mb-3 space-y-0.5">
            {(isClient ? clientNav : mainNav).map((item) => (
              <li key={item.href}>
                <SheetLink href={item.href} active={isActive(item.href)} onNavigate={() => setMenuOpen(false)}>
                  {item.label}
                </SheetLink>
              </li>
            ))}
            {isClient && (
              <li>
                <SheetLink href="/profil" active={isActive("/profil")} onNavigate={() => setMenuOpen(false)} icon={<UserRound size={17} aria-hidden />}>
                  Mon profil
                </SheetLink>
              </li>
            )}
            {!isClient && (
              <li>
                <a
                  href={siteConfig.academyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy/80 transition-colors hover:bg-navy/[0.04] hover:text-navy"
                >
                  <span className="flex items-center gap-3">
                    <GraduationCap size={17} aria-hidden />
                    Access Academy
                  </span>
                  <ChevronRight size={16} className="text-text-muted" aria-hidden />
                </a>
              </li>
            )}
          </ul>

          {initialUser ? (
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-error transition-colors hover:bg-error/[0.06]"
            >
              <LogOut size={17} aria-hidden />
              Déconnexion
            </button>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-xl border border-navy/[0.12] py-3 text-center text-sm font-bold text-navy transition-colors hover:border-brand-blue-vif/40"
              >
                Connexion
              </Link>
              <Link
                href="/devis"
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-xl bg-gradient-da py-3 text-center text-sm font-bold text-white shadow-brand transition-transform active:scale-[0.98]"
              >
                Devis gratuit
              </Link>
            </div>
          )}
        </div>
      </Sheet>
    </>
  );
}

function SheetLink({
  href,
  active,
  onNavigate,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        active ? "bg-gradient-da text-white shadow-brand" : "text-navy/80 hover:bg-navy/[0.04] hover:text-navy",
      )}
    >
      <span className="flex items-center gap-3">
        {icon}
        {children}
      </span>
      {!active && <ChevronRight size={16} className="text-text-muted" aria-hidden />}
    </Link>
  );
}
