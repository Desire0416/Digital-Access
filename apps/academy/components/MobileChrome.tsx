"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Home,
  BookOpen,
  Route,
  UsersRound,
  LayoutDashboard,
  CalendarDays,
  MessagesSquare,
  Menu as MenuIcon,
  Search,
  LogOut,
  GraduationCap,
  ShieldCheck,
  ClipboardCheck,
  ChevronRight,
  X,
} from "lucide-react";
import { MobileTabBar, InstallPrompt, Sheet, cn, type MobileTab } from "@da/ui";
import { mainNav, userNavGroups } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille mobile d'Access Academy — barre d'onglets basse façon application +
   invite d'installation + « Menu » en bottom-sheet (l'espace connecté a 16
   destinations : impossible de tout mettre en onglets). Montée une fois dans le
   layout racine, via portail, masquée en desktop (lg:hidden) et sur les
   contextes à coque propre : lecteur immersif /apprendre, back-office /admin,
   pages d'authentification.
   ══════════════════════════════════════════════════════════════════════════ */

const ADMIN_ROLES = ["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"];
const HIDDEN_PREFIXES = ["/apprendre", "/admin", "/connexion", "/inscription", "/auth"];

const hasAny = (roles: string[], set: string[]) => roles.some((r) => set.includes(r));

export function MobileChrome({ roles, authed }: { roles: string[]; authed: boolean }) {
  const pathname = usePathname() ?? "/";
  const [mounted, setMounted] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  React.useEffect(() => {
    if (hidden) {
      document.body.classList.remove("has-mobile-tabbar");
      return;
    }
    document.body.classList.add("has-mobile-tabbar");
    return () => document.body.classList.remove("has-mobile-tabbar");
  }, [hidden]);

  // Ferme le menu à chaque navigation.
  React.useEffect(() => setMenuOpen(false), [pathname]);

  const tabs: MobileTab[] = React.useMemo(() => {
    const menuTab: MobileTab = { key: "menu", label: "Menu", icon: MenuIcon, onClick: () => setMenuOpen(true) };
    if (authed) {
      return [
        { key: "espace", label: "Espace", href: "/espace", icon: LayoutDashboard },
        { key: "formations", label: "Formations", href: "/espace/formations", icon: BookOpen },
        { key: "agenda", label: "Agenda", href: "/espace/agenda", icon: CalendarDays },
        { key: "communaute", label: "Communauté", href: "/espace/communaute", icon: MessagesSquare },
        menuTab,
      ];
    }
    return [
      { key: "home", label: "Accueil", href: "/", icon: Home },
      { key: "formations", label: "Formations", href: "/formations", icon: BookOpen },
      { key: "parcours", label: "Parcours", href: "/parcours-metiers", icon: Route },
      { key: "cohortes", label: "Cohortes", href: "/cohortes", icon: UsersRound },
      menuTab,
    ];
  }, [authed]);

  const roleLinks = React.useMemo(() => {
    const links: { label: string; href: string; Icon: typeof GraduationCap }[] = [];
    if (hasAny(roles, [...ADMIN_ROLES, "INSTRUCTOR"])) links.push({ label: "Studio formateur", href: "/formateur", Icon: GraduationCap });
    if (hasAny(roles, [...ADMIN_ROLES, "MENTOR"])) links.push({ label: "Mentorat", href: "/mentorat", Icon: UsersRound });
    if (hasAny(roles, [...ADMIN_ROLES, "GRADER", "INSTRUCTOR"])) links.push({ label: "Correction", href: "/correction", Icon: ClipboardCheck });
    if (hasAny(roles, ADMIN_ROLES)) links.push({ label: "Administration", href: "/admin", Icon: ShieldCheck });
    return links;
  }, [roles]);

  if (!mounted || hidden) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {createPortal(
        <div className="lg:hidden">
          <InstallPrompt appName="Access Academy" tagline="Vos cours et cohortes, en plein écran." />
          <MobileTabBar tabs={tabs} pathname={pathname} indicatorId="academy-tab-active" />
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
          {authed ? (
            <>
              {userNavGroups.map((group) => (
                <div key={group.title} className="mb-4">
                  <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">{group.title}</p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <SheetLink href={item.href} active={isActive(item.href)} onNavigate={() => setMenuOpen(false)}>
                          {item.label}
                        </SheetLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {roleLinks.length > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">Espaces pro</p>
                  <ul className="space-y-0.5">
                    {roleLinks.map(({ label, href, Icon }) => (
                      <li key={href}>
                        <SheetLink href={href} active={isActive(href)} onNavigate={() => setMenuOpen(false)} icon={<Icon size={17} aria-hidden />}>
                          {label}
                        </SheetLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-error transition-colors hover:bg-error/[0.06]"
              >
                <LogOut size={17} aria-hidden />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <ul className="mb-4 space-y-0.5">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <SheetLink href={item.href} active={isActive(item.href)} onNavigate={() => setMenuOpen(false)}>
                      {item.label}
                    </SheetLink>
                  </li>
                ))}
                <li>
                  <SheetLink href="/recherche" active={isActive("/recherche")} onNavigate={() => setMenuOpen(false)} icon={<Search size={17} aria-hidden />}>
                    Rechercher
                  </SheetLink>
                </li>
              </ul>
              <div className="flex gap-2 pt-1">
                <Link
                  href="/connexion"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-xl border border-navy/[0.12] py-3 text-center text-sm font-bold text-navy transition-colors hover:border-brand-blue-vif/40"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-xl bg-gradient-da py-3 text-center text-sm font-bold text-white shadow-brand transition-transform active:scale-[0.98]"
                >
                  Inscription
                </Link>
              </div>
            </>
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
