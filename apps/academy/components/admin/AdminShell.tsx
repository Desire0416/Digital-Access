"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  GraduationCap,
  Route,
  BookOpen,
  UsersRound,
  ClipboardCheck,
  Award,
  Ticket,
  ExternalLink,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { Monogram, Avatar, cn } from "@da/ui";
import { LogoutButton } from "@/components/LogoutButton";
import { ViewAsMenu } from "@/components/admin/ViewAsMenu";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Écoles", href: "/admin/ecoles", icon: GraduationCap },
  { label: "Parcours", href: "/admin/parcours", icon: Route },
  { label: "Formations", href: "/admin/formations", icon: BookOpen },
  { label: "Utilisateurs", href: "/admin/utilisateurs", icon: UsersRound },
  { label: "Soumissions", href: "/admin/soumissions", icon: ClipboardCheck },
  { label: "Certificats", href: "/admin/certificats", icon: Award },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
];

const STORAGE_KEY = "academy-admin-sidebar-collapsed";

/** Contenu de la barre latérale (partagé desktop fixe / tiroir mobile). */
function SidebarContent({
  user,
  isActive,
  collapsed,
  onNavigate,
  onToggleCollapse,
}: {
  user: { name: string; email: string; isSuperAdmin: boolean };
  isActive: (href: string) => boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-[#0f0f1e] text-white">
      {/* Marque + bouton replier */}
      <div
        className={cn(
          "flex items-center py-6",
          collapsed ? "flex-col gap-4 px-3" : "justify-between gap-2 px-5",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-da">
            <Monogram variant="white" size={24} />
          </span>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-display text-sm font-extrabold">Access Academy</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                Back-office
              </p>
            </div>
          )}
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
            title={collapsed ? "Déplier" : "Replier"}
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white lg:grid"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-2",
          collapsed ? "px-2.5" : "px-3",
        )}
      >
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center rounded-xl text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {active && (
                <motion.span
                  layoutId="academy-admin-nav-active"
                  className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-gradient-to-b from-brand-violet to-brand-cyan"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <item.icon
                size={18}
                className={cn(
                  "shrink-0",
                  active ? "text-brand-cyan" : "text-white/50 group-hover:text-white/80",
                )}
              />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Voir en tant que rôle (mode aperçu admin) */}
      {!collapsed && (
        <div className="px-3 pb-1 pt-2">
          <ViewAsMenu />
        </div>
      )}

      {/* Retour au site */}
      <div className={cn("pb-2", collapsed ? "px-2.5" : "px-3")}>
        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? "Voir la plateforme" : undefined}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white",
            collapsed ? "justify-center px-0 py-3" : "gap-2 px-3.5 py-2.5",
          )}
        >
          <ExternalLink size={16} className="shrink-0" />
          {!collapsed && "Voir la plateforme"}
        </Link>
      </div>

      {/* Utilisateur — cliquable vers le profil */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/profil"
          onClick={onNavigate}
          title="Voir et modifier mon profil"
          className={cn(
            "flex items-center rounded-xl transition-colors hover:bg-white/[0.06]",
            collapsed ? "justify-center px-0 py-2" : "gap-3 px-2 py-2",
          )}
        >
          <Avatar name={user.name} className="h-9 w-9 shrink-0 text-xs" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-white/50">
                {user.isSuperAdmin ? "Super Admin" : "Administrateur"} · Profil
              </p>
            </div>
          )}
        </Link>
        {!collapsed && (
          <LogoutButton
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-center text-white/70 hover:bg-white/[0.06] hover:text-white"
          />
        )}
      </div>
    </div>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string; isSuperAdmin: boolean };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  // Persistance du repli de la sidebar.
  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);
  const toggleCollapse = React.useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const isActive = React.useCallback(
    (href: string) =>
      href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"),
    [pathname],
  );

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const current = NAV.find((n) => isActive(n.href));

  /* Région autonome en 100dvh avec défilement interne : insensible aux
     transformes d'ancêtres (PageTransition), donc pas de sticky/fixed cassé. */
  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-surface-secondary">
      {/* Sidebar — desktop (largeur animée) */}
      <aside
        className={cn(
          "hidden shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <SidebarContent
          user={user}
          isActive={isActive}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Colonne droite */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure — mobile */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-navy/[0.06] bg-surface-primary px-4 lg:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <Monogram size={30} />
            <span className="font-display text-sm font-extrabold text-navy">
              {current?.label ?? "Admin"}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-lg text-navy transition-colors hover:bg-navy/5"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Contenu défilant */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
        </main>
      </div>

      {/* Tiroir — mobile (superposition dans la région, pas de fixed) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="admin-scrim"
              type="button"
              aria-label="Fermer le menu"
              tabIndex={-1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="admin-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 38 }}
              className="absolute inset-y-0 left-0 z-50 w-[17rem] max-w-[85%] shadow-2xl lg:hidden"
            >
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
              <SidebarContent
                user={user}
                isActive={isActive}
                collapsed={false}
                onNavigate={() => setOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
