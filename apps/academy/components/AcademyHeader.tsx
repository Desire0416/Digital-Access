"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, GraduationCap, LayoutDashboard, ClipboardCheck } from "lucide-react";
import { Avatar, buttonClasses, cn, useScrolled } from "@da/ui";
import { catalogueMenu, primaryNav, audienceNav } from "@/lib/site";
import { AcademyLogo } from "./AcademyLogo";
import { CatalogueMenu } from "./CatalogueMenu";
import { HomeSearch } from "./HomeSearch";
import { LogoutButton } from "./LogoutButton";
import { NotificationBell } from "./NotificationBell";

type HeaderUser = { name?: string | null; email?: string | null; roles?: string[] };

export function AcademyHeader({ initialUser }: { initialUser?: HeaderUser | null }) {
  const pathname = usePathname();
  const scrolled = useScrolled(10);
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();
  // La session serveur (initialUser, résolue par requête) fait foi ; useSession
  // ne sert qu'aux mises à jour réactives (connexion/déconnexion sans rechargement).
  const user = (session?.user as HeaderUser | undefined) ?? initialUser ?? undefined;
  // Destination « mon espace » : le tableau de bord apprenant.
  const homeHref = "/dashboard";

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Verrouille le défilement de l'arrière-plan quand le menu mobile est ouvert.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isReviewer = Boolean(user?.roles?.some((r) => ["REVIEWER", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(r)));
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-navy/[0.06] bg-surface-primary/85 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      {/* Barre « publics » (façon Coursera) — se replie au défilement */}
      <div
        className={cn(
          "overflow-hidden border-b border-navy/[0.04] transition-all duration-300",
          scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100",
        )}
      >
        <div className="mx-auto flex h-9 max-w-7xl items-center gap-0.5 px-5 sm:px-8 lg:px-10">
          {audienceNav.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-semibold transition-colors",
                isActive(a.href) ? "text-brand-blue-royal" : "text-text-muted hover:text-navy",
              )}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative z-50 mx-auto flex h-16 max-w-7xl items-center gap-3 px-5 sm:px-8 lg:h-18 lg:gap-4 lg:px-10">
        <Link href="/" aria-label="Access Academy — accueil" className="shrink-0">
          <AcademyLogo size={38} />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden shrink-0 items-center gap-1 lg:flex">
          <CatalogueMenu />
          {primaryNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "text-brand-blue-royal"
                  : "text-text-secondary hover:text-navy",
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <motion.span
                  layoutId="academy-nav-underline"
                  className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-da"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Recherche (desktop) */}
        <div className="hidden min-w-0 flex-1 lg:block">
          <HomeSearch variant="header" className="mx-auto max-w-md" />
        </div>

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          {user ? (
            <>
              {isReviewer && (
                <Link href="/reviews" className={cn(buttonClasses({ variant: "ghost", size: "sm" }), "gap-1.5")}>
                  <ClipboardCheck size={16} /> Relecture
                </Link>
              )}
              <NotificationBell />
              <Link
                href={homeHref}
                className={cn(buttonClasses({ variant: "ghost", size: "sm" }), "gap-2")}
              >
                <Avatar
                  name={user.name ?? user.email ?? "Vous"}
                  className="h-7 w-7 text-xs"
                />
                <span className="max-w-[9rem] truncate">
                  {user.name ?? "Mon espace"}
                </span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className={buttonClasses({ variant: "primary", size: "sm" })}
              >
                <GraduationCap size={16} />
                Commencer
              </Link>
            </>
          )}
        </div>

        {/* Actions mobile : cloche + toggle */}
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          {user && <NotificationBell />}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-navy transition-colors hover:bg-navy/5"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu mobile — superposition (ne pousse jamais le contenu vers le bas) */}
      <AnimatePresence>
        {open && (
          <>
            {/* Voile cliquable */}
            <motion.button
              key="menu-scrim"
              type="button"
              aria-label="Fermer le menu"
              tabIndex={-1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="absolute inset-x-0 top-full z-40 h-[100dvh] bg-navy/40 backdrop-blur-sm lg:hidden"
            />
            {/* Panneau du menu */}
            <motion.div
              key="menu-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto bg-surface-primary shadow-xl lg:hidden"
            >
              <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 sm:px-8">
              <div className="px-1 pb-3">
                <HomeSearch variant="header" />
              </div>
              <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">{catalogueMenu.label}</p>
              {catalogueMenu.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-4 py-3 text-base font-medium transition-colors",
                    isActive(item.href) ? "bg-brand-blue-vif/10 text-brand-blue-royal" : "text-navy hover:bg-navy/5",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={catalogueMenu.secondary.href}
                className={cn(
                  "rounded-lg px-4 py-3 text-base font-medium transition-colors",
                  isActive(catalogueMenu.secondary.href) ? "bg-brand-blue-vif/10 text-brand-blue-royal" : "text-navy hover:bg-navy/5",
                )}
              >
                {catalogueMenu.secondary.label}
              </Link>
              <div className="my-1 h-px bg-navy/[0.06]" />
              {primaryNav.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-4 py-3 text-base font-medium transition-colors",
                    isActive(item.href) ? "bg-brand-blue-vif/10 text-brand-blue-royal" : "text-navy hover:bg-navy/5",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                {user ? (
                  <>
                    {isReviewer && (
                      <Link href="/reviews" className={cn(buttonClasses({ variant: "outline", size: "md" }), "gap-2")}>
                        <ClipboardCheck size={17} /> Relecture
                      </Link>
                    )}
                    <Link
                      href={homeHref}
                      className={cn(buttonClasses({ variant: "outline", size: "md" }), "gap-2")}
                    >
                      <LayoutDashboard size={17} />
                      Mon dashboard
                    </Link>
                    <LogoutButton variant="ghost" size="md" className="justify-center" />
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className={buttonClasses({ variant: "outline", size: "md" })}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/auth/register"
                      className={buttonClasses({ variant: "primary", size: "md" })}
                    >
                      <GraduationCap size={17} />
                      Créer un compte
                    </Link>
                  </>
                )}
              </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
