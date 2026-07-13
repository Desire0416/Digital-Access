"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShieldCheck,
  LayoutDashboard,
  BookOpen,
  Route,
  FolderKanban,
  ClipboardCheck,
  Award,
  Briefcase,
  Heart,
  Settings,
  Target,
} from "lucide-react";
import { cn, buttonClasses, Avatar, useScrolled } from "@da/ui";
import { mainNav, userNav } from "@/lib/site";
import { NotificationBell, type NotificationItem } from "@/components/NotificationBell";

/* ══════════════════════════════════════════════════════════════════════════
   Header public Access Academy — sticky, brandé DA (cahier §8).
   L'utilisateur arrive en PROP depuis le layout serveur : aucun fetch client.
   ══════════════════════════════════════════════════════════════════════════ */

export interface HeaderUser {
  name: string;
  avatar: string | null;
  roles: string[];
}

export interface SiteHeaderProps {
  user: HeaderUser | null;
  notifications?: { items: NotificationItem[]; unreadCount: number } | null;
}

const ADMIN_ROLES = ["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"];
const REVIEWER_ROLES = ["GRADER", "INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"];

const USER_NAV_ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  "/espace": LayoutDashboard,
  "/espace/formations": BookOpen,
  "/espace/parcours": Route,
  "/espace/projets": FolderKanban,
  "/espace/evaluations": ClipboardCheck,
  "/espace/certificats": Award,
  "/espace/competences": Target,
  "/espace/portfolio": Briefcase,
  "/espace/favoris": Heart,
  "/espace/parametres": Settings,
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* Navigation du tiroir mobile en SECTIONS titrées (§8). « Accueil » est porté
   par le logo → absent d'ici. La nav desktop garde `mainNav` (liste à plat). */
const MOBILE_NAV_GROUPS: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Explorer",
    items: [
      { label: "Formations", href: "/formations" },
      { label: "Parcours métiers", href: "/parcours-metiers" },
      { label: "Écoles", href: "/ecoles" },
    ],
  },
  {
    title: "Certification & entreprises",
    items: [
      { label: "Certifications", href: "/certifications" },
      { label: "Entreprises", href: "/entreprises" },
    ],
  },
  {
    title: "L'académie",
    items: [{ label: "À propos", href: "/a-propos" }],
  },
];

/* ─── Champ de recherche (submit → /formations?q=) ─────────────────────── */
function SearchField({
  autoFocus,
  onDone,
  className,
}: {
  autoFocus?: boolean;
  onDone?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push(query ? `/recherche?q=${encodeURIComponent(query)}` : "/recherche");
        onDone?.();
      }}
    >
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Rechercher une formation, un parcours…"
        aria-label="Rechercher sur Access Academy"
        className="h-10 w-full rounded-full border border-navy/10 bg-surface-secondary pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60 focus:bg-surface-primary"
      />
    </form>
  );
}

/* ─── Menu avatar (desktop) ────────────────────────────────────────────── */
function UserMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const admin = user.roles.some((r) => ADMIN_ROLES.includes(r));
  const reviewer = user.roles.some((r) => REVIEWER_ROLES.includes(r));
  const instructor = user.roles.includes("INSTRUCTOR");

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu du compte"
        className="flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-navy/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif"
      >
        <Avatar name={user.name} src={user.avatar ?? undefined} className="h-9 w-9" />
        <ChevronDown
          size={14}
          className={cn("mr-1 text-text-secondary transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-xl"
          >
            <div className="border-b border-navy/[0.06] bg-surface-secondary/60 px-4 py-3">
              <p className="truncate font-display text-sm font-bold text-navy">{user.name}</p>
              <span className="mt-0.5 block h-0.5 w-8 rounded-full bg-gradient-da" aria-hidden />
            </div>

            <nav className="p-1.5">
              {userNav.map((item) => {
                const Icon = USER_NAV_ICONS[item.href] ?? LayoutDashboard;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-brand-blue-vif/[0.07] hover:text-brand-blue-royal"
                  >
                    <Icon size={15} className="text-text-muted" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}

              {reviewer && (
                <>
                  <span className="my-1.5 block h-px bg-navy/[0.06]" aria-hidden />
                  <Link
                    href="/correction"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand-blue-royal transition-colors hover:bg-brand-blue-vif/[0.07]"
                  >
                    <ClipboardCheck size={15} aria-hidden />
                    Corrections
                  </Link>
                </>
              )}

              {instructor && (
                <>
                  {!reviewer && <span className="my-1.5 block h-px bg-navy/[0.06]" aria-hidden />}
                  <Link
                    href="/formateur"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/[0.08]"
                  >
                    <BookOpen size={15} aria-hidden />
                    Studio formateur
                  </Link>
                </>
              )}

              {admin && (
                <>
                  {!reviewer && !instructor && <span className="my-1.5 block h-px bg-navy/[0.06]" aria-hidden />}
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand-violet transition-colors hover:bg-brand-violet/[0.07]"
                  >
                    <ShieldCheck size={15} aria-hidden />
                    Administration
                  </Link>
                </>
              )}

              <span className="my-1.5 block h-px bg-navy/[0.06]" aria-hidden />
              <button
                type="button"
                role="menuitem"
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-error transition-colors hover:bg-error/[0.06]"
              >
                <LogOut size={15} aria-hidden />
                Déconnexion
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Header principal ─────────────────────────────────────────────────── */
export function SiteHeader({ user, notifications }: SiteHeaderProps) {
  const pathname = usePathname();
  const scrolled = useScrolled(8);
  const reduce = useReducedMotion();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const admin = !!user && user.roles.some((r) => ADMIN_ROLES.includes(r));
  const reviewer = !!user && user.roles.some((r) => REVIEWER_ROLES.includes(r));
  const instructor = !!user && user.roles.includes("INSTRUCTOR");

  // Accordéon du tiroir mobile : sections repliables. La section contenant la
  // page active est ouverte par défaut (et rouverte à chaque navigation).
  const activeSection = React.useMemo(() => {
    const g = MOBILE_NAV_GROUPS.find((grp) => grp.items.some((it) => isActivePath(pathname, it.href)));
    if (g) return g.title;
    if (/^\/(espace|correction|formateur|admin)/.test(pathname)) return "Mon espace";
    return "Explorer";
  }, [pathname]);
  const [openSections, setOpenSections] = React.useState<Set<string>>(() => new Set([activeSection]));
  React.useEffect(() => setOpenSections(new Set([activeSection])), [activeSection]);
  const toggleSection = React.useCallback((title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  // Ferme le tiroir mobile à chaque navigation.
  React.useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Verrouille le scroll quand le tiroir mobile est ouvert.
  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-navy/[0.07] bg-surface-primary/90 shadow-[0_4px_24px_-12px_rgba(26,26,46,0.15)] backdrop-blur-xl"
          : "border-transparent bg-surface-primary",
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
        {/* Logo */}
        <Link href="/" aria-label="Access Academy — accueil" className="flex shrink-0 items-center">
          <Image
            src="/logo-access-academy.png"
            alt="Access Academy"
            width={200}
            height={193}
            priority
            className="h-12 w-auto lg:h-14"
          />
        </Link>

        {/* Navigation desktop */}
        <nav aria-label="Navigation principale" className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
          {mainNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-navy" : "text-text-secondary hover:text-navy",
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="header-active-underline"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-da"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions droite */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Recherche (desktop : champ extensible) */}
          <div className="hidden items-center md:flex">
            <AnimatePresence initial={false} mode="popLayout">
              {searchOpen ? (
                <motion.div
                  key="field"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 260 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchOpen(false);
                  }}
                >
                  <SearchField autoFocus onDone={() => setSearchOpen(false)} />
                </motion.div>
              ) : (
                <motion.button
                  key="button"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Rechercher une formation"
                  className="grid h-10 w-10 place-items-center rounded-full text-text-secondary transition-colors hover:bg-navy/[0.05] hover:text-navy"
                >
                  <Search size={18} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <>
              {/* Cloche notifications — panneau réel (backend §26) */}
              {notifications && (
                <NotificationBell initialItems={notifications.items} initialUnread={notifications.unreadCount} />
              )}
              <div className="hidden lg:block">
                <UserMenu user={user} />
              </div>
              {/* Avatar simple sur mobile (le détail vit dans le tiroir) */}
              <Avatar name={user.name} src={user.avatar ?? undefined} className="h-9 w-9 lg:hidden" />
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy/[0.05] sm:inline-flex"
              >
                Se connecter
              </Link>
              <Link href="/inscription" className={buttonClasses({ size: "sm", className: "hidden sm:inline-flex" })}>
                Commencer
              </Link>
            </>
          )}

          {/* Burger mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            className="grid h-10 w-10 place-items-center rounded-lg text-navy transition-colors hover:bg-navy/[0.05] lg:hidden"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

    </header>

      {/* ─── Tiroir mobile — rendu via un PORTAIL vers <body>, hors du
          <header>. En état « scrolled » le header porte `backdrop-blur`
          (backdrop-filter) qui crée un containing-block : un position:fixed
          descendant se calerait alors sur les ~64px du header au lieu de la
          fenêtre → le menu « ne se déroulait pas » en milieu de page. ─────── */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  key="overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setMobileOpen(false)}
                  className="fixed inset-0 z-[60] bg-navy/40 backdrop-blur-sm lg:hidden"
                  aria-hidden
                />
                <motion.aside
                  key="drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Menu"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }}
                  className="fixed inset-y-0 right-0 z-[61] flex w-[min(20rem,88vw)] flex-col overflow-y-auto overscroll-contain bg-surface-primary shadow-2xl lg:hidden"
                >
                  {/* En-tête : logo (→ accueil) + fermer */}
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy/[0.06] bg-surface-primary px-4 py-3">
                    <Link href="/" aria-label="Accueil Access Academy" onClick={() => setMobileOpen(false)} className="shrink-0">
                      <Image src="/logo-access-academy.png" alt="Access Academy" width={180} height={173} className="h-11 w-auto" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      aria-label="Fermer le menu"
                      className="grid h-10 w-10 place-items-center rounded-lg text-navy transition-colors hover:bg-navy/[0.05]"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Recherche */}
                  <div className="border-b border-navy/[0.06] p-4">
                    <SearchField onDone={() => setMobileOpen(false)} />
                  </div>

                  {/* Navigation en accordéon — chaque section se replie/déplie.
                      La section de la page active est ouverte par défaut. */}
                  <nav aria-label="Navigation principale mobile" className="flex-1 p-2">
                    {MOBILE_NAV_GROUPS.map((group) => {
                      const open = openSections.has(group.title);
                      return (
                        <div key={group.title} className="border-b border-navy/[0.05] last:border-b-0">
                          <button
                            type="button"
                            onClick={() => toggleSection(group.title)}
                            aria-expanded={open}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-navy/[0.03]"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                              {group.title}
                            </span>
                            <ChevronDown
                              size={16}
                              className={cn("shrink-0 text-text-muted transition-transform duration-200", open && "rotate-180")}
                              aria-hidden
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {open && (
                              <motion.div
                                initial={reduce ? false : { height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="pb-1.5">
                                  {group.items.map((item) => {
                                    const active = isActivePath(pathname, item.href);
                                    return (
                                      <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={active ? "page" : undefined}
                                        className={cn(
                                          "flex items-center justify-between rounded-xl px-4 py-2.5 font-display text-[0.95rem] font-semibold transition-colors",
                                          active ? "bg-brand-blue-vif/[0.08] text-brand-blue-royal" : "text-navy hover:bg-navy/[0.04]",
                                        )}
                                      >
                                        {item.label}
                                        {active && <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" aria-hidden />}
                                      </Link>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {user && (
                      <div className="border-t border-navy/[0.05]">
                        <button
                          type="button"
                          onClick={() => toggleSection("Mon espace")}
                          aria-expanded={openSections.has("Mon espace")}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-navy/[0.03]"
                        >
                          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                            Mon espace
                          </span>
                          <ChevronDown
                            size={16}
                            className={cn(
                              "shrink-0 text-text-muted transition-transform duration-200",
                              openSections.has("Mon espace") && "rotate-180",
                            )}
                            aria-hidden
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {openSections.has("Mon espace") && (
                            <motion.div
                              initial={reduce ? false : { height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="pb-1.5">
                                {userNav.map((item) => {
                                  const Icon = USER_NAV_ICONS[item.href] ?? LayoutDashboard;
                                  const active = isActivePath(pathname, item.href);
                                  return (
                                    <Link
                                      key={item.href}
                                      href={item.href}
                                      aria-current={active ? "page" : undefined}
                                      className={cn(
                                        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                                        active ? "bg-brand-blue-vif/[0.08] text-brand-blue-royal" : "text-navy hover:bg-navy/[0.04]",
                                      )}
                                    >
                                      <Icon size={16} className={active ? "text-brand-blue-royal" : "text-text-muted"} aria-hidden />
                                      {item.label}
                                    </Link>
                                  );
                                })}
                                {reviewer && (
                                  <Link
                                    href="/correction"
                                    className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:bg-brand-blue-vif/[0.06]"
                                  >
                                    <ClipboardCheck size={16} aria-hidden />
                                    Corrections
                                  </Link>
                                )}
                                {instructor && (
                                  <Link
                                    href="/formateur"
                                    className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/[0.06]"
                                  >
                                    <BookOpen size={16} aria-hidden />
                                    Studio formateur
                                  </Link>
                                )}
                                {admin && (
                                  <Link
                                    href="/admin"
                                    className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-violet transition-colors hover:bg-brand-violet/[0.06]"
                                  >
                                    <ShieldCheck size={16} aria-hidden />
                                    Administration
                                  </Link>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </nav>

                  {/* Pied : compte / CTA */}
                  <div className="sticky bottom-0 border-t border-navy/[0.06] bg-surface-primary p-4">
                    {user ? (
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} src={user.avatar ?? undefined} className="h-10 w-10" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-navy">{user.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void signOut({ callbackUrl: "/" })}
                          aria-label="Déconnexion"
                          className="grid h-10 w-10 place-items-center rounded-lg text-error transition-colors hover:bg-error/[0.06]"
                        >
                          <LogOut size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-2.5">
                        <Link href="/inscription" className={buttonClasses({ className: "w-full" })} onClick={() => setMobileOpen(false)}>
                          Commencer
                        </Link>
                        <Link
                          href="/connexion"
                          className={buttonClasses({ variant: "outline", className: "w-full" })}
                          onClick={() => setMobileOpen(false)}
                        >
                          Se connecter
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
