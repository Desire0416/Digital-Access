"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Tags,
  UsersRound,
  Wallet,
  Repeat,
  Ticket,
  Settings,
  ExternalLink,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Monogram, Avatar, cn } from "@da/ui";
import { LogoutButton } from "@/components/LogoutButton";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Cours", href: "/admin/courses", icon: BookOpen },
  { label: "Catégories", href: "/admin/categories", icon: Tags },
  { label: "Utilisateurs", href: "/admin/users", icon: UsersRound },
  { label: "Paiements", href: "/admin/payments", icon: Wallet },
  { label: "Abonnements", href: "/admin/subscriptions", icon: Repeat },
  { label: "Codes promo", href: "/admin/promo-codes", icon: Ticket },
  { label: "Paramètres", href: "/admin/settings", icon: Settings },
];

/** Contenu de la barre latérale (partagé desktop fixe / tiroir mobile). */
function SidebarContent({
  user,
  isActive,
  onNavigate,
}: {
  user: { name: string; email: string; isSuperAdmin: boolean };
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-[#0f0f1e] text-white">
      {/* Marque */}
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-da">
          <Monogram variant="white" size={24} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-extrabold">Access Academy</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            Back-office
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
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
                  active ? "text-brand-cyan" : "text-white/50 group-hover:text-white/80",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Retour au site */}
      <div className="px-3 pb-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ExternalLink size={16} />
          Voir la plateforme
        </Link>
      </div>

      {/* Utilisateur */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.name} className="h-9 w-9 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-white/50">
              {user.isSuperAdmin ? "Super Admin" : "Administrateur"}
            </p>
          </div>
        </div>
        <LogoutButton
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-center text-white/70 hover:bg-white/[0.06] hover:text-white"
        />
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

  const isActive = React.useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
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
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent user={user} isActive={isActive} />
      </aside>

      {/* Colonne droite */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure — mobile */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-navy/[0.06] bg-surface-primary px-4 lg:hidden">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
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
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
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
              <SidebarContent user={user} isActive={isActive} onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
