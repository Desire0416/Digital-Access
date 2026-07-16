"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  Route,
  GraduationCap,
  Users,
  CreditCard,
  Award,
  Globe,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Ticket,
  ClipboardCheck,
  Target,
  BadgeCheck,
  UsersRound,
  CalendarDays,
} from "lucide-react";
import { cn, Avatar } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille du back-office Access Academy (cahier §30). Barre latérale sombre
   rétractable (état mémorisé en localStorage), tiroir sur mobile. Indicateur
   actif = filet dégradé signature partagé (layoutId). Profil + déconnexion en
   pied. Gardé en amont par app/admin/layout.tsx (requireRole).
   ══════════════════════════════════════════════════════════════════════════ */

export interface AdminShellUser {
  name: string;
  email: string;
  avatar: string | null;
  roles: string[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  badge?: number;
  exact?: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  ACADEMIC_ADMIN: "Admin pédagogique",
  SALES_ADMIN: "Admin commercial",
};

const COLLAPSE_KEY = "da-admin-sidebar-collapsed";

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/* ─── Contenu de la barre latérale (partagé desktop / tiroir) ──────────────── */
function SidebarContent({
  items,
  user,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  user: AdminShellUser;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const roleLabel = ROLE_LABEL[user.roles.find((r) => ROLE_LABEL[r]) ?? ""] ?? "Administration";

  return (
    <div className="flex h-full flex-col">
      {/* Marque */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-white/[0.06]", collapsed ? "justify-center px-2" : "px-5")}>
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5" aria-label="Administration Access Academy">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-da text-sm font-black text-white shadow-lg">
            DA
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold text-white">Access Academy</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-cyan">Back-office</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-4" aria-label="Navigation administration">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active ? "text-white" : "text-white/55 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-active-bg"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-da opacity-95 shadow-lg"
                  aria-hidden
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="relative">{item.label}</span>}
              </span>
              {!collapsed && item.badge ? (
                <span
                  className={cn(
                    "relative z-10 ml-auto grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    active ? "bg-white/25 text-white" : "bg-warning text-navy",
                  )}
                >
                  {item.badge}
                </span>
              ) : collapsed && item.badge ? (
                <span className="absolute right-1.5 top-1.5 z-10 h-2 w-2 rounded-full bg-warning ring-2 ring-[#0f0f1e]" aria-hidden />
              ) : null}
            </Link>
          );
        })}

        <span className="my-3 block h-px bg-white/[0.06]" aria-hidden />

        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? "Voir le site" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white",
            collapsed && "justify-center px-0",
          )}
        >
          <Globe size={18} className="shrink-0" />
          {!collapsed && "Voir le site"}
        </Link>
      </nav>

      {/* Profil + déconnexion */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className={cn("flex items-center gap-2.5", collapsed && "flex-col gap-2")}>
          <Avatar name={user.name} src={user.avatar ?? undefined} className="h-9 w-9 shrink-0 ring-2 ring-white/10" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-brand-cyan">{roleLabel}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/" })}
            aria-label="Déconnexion"
            title="Déconnexion"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/50 transition-colors hover:bg-error/20 hover:text-error"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Coquille principale ──────────────────────────────────────────────────── */
export function AdminShell({
  user,
  pendingPayments,
  pendingEquivalences = 0,
  children,
}: {
  user: AdminShellUser;
  pendingPayments: number;
  pendingEquivalences?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const items: NavItem[] = React.useMemo(
    () => [
      { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Formations", href: "/admin/formations", icon: BookOpen },
      { label: "Parcours", href: "/admin/parcours", icon: Route },
      { label: "Écoles", href: "/admin/ecoles", icon: GraduationCap },
      { label: "Compétences", href: "/admin/competences", icon: Target },
      { label: "Cohortes", href: "/admin/cohortes", icon: UsersRound },
      { label: "Événements", href: "/admin/evenements", icon: CalendarDays },
      { label: "Utilisateurs", href: "/admin/utilisateurs", icon: Users },
      { label: "Paiements", href: "/admin/paiements", icon: CreditCard, badge: pendingPayments || undefined },
      { label: "Équivalences", href: "/admin/equivalences", icon: BadgeCheck, badge: pendingEquivalences || undefined },
      { label: "Coupons", href: "/admin/coupons", icon: Ticket },
      { label: "Certificats", href: "/admin/certificats", icon: Award },
      { label: "Corrections", href: "/correction", icon: ClipboardCheck },
    ],
    [pendingPayments, pendingEquivalences],
  );

  // Restaure l'état replié depuis localStorage.
  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* pas de localStorage : par défaut déplié */
    }
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Ferme le tiroir mobile à chaque navigation.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Verrouille le scroll du corps quand le tiroir est ouvert.
  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-surface-secondary/60">
      {/* ─── Barre latérale desktop ─────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden bg-[#0f0f1e] transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <SidebarContent items={items} user={user} collapsed={collapsed} />
        {/* Poignée de repli */}
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
          className="absolute -right-3 top-20 grid h-6 w-6 place-items-center rounded-full border border-navy/10 bg-surface-primary text-text-secondary shadow-md transition-colors hover:text-brand-blue-royal"
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>
      </aside>

      {/* ─── Barre supérieure mobile ────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-navy/[0.07] bg-surface-primary/90 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu d'administration"
          className="grid h-10 w-10 place-items-center rounded-lg text-navy transition-colors hover:bg-navy/[0.05]"
        >
          <Menu size={22} />
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-da text-xs font-black text-white">DA</span>
          <span className="font-display text-sm font-bold text-navy">Back-office</span>
        </Link>
      </div>

      {/* ─── Tiroir mobile ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="admin-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
              aria-hidden
            />
            <motion.aside
              key="admin-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu d'administration"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[min(17rem,86vw)] bg-[#0f0f1e] shadow-2xl lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
                className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
              <SidebarContent items={items} user={user} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Contenu ────────────────────────────────────────────────────── */}
      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
