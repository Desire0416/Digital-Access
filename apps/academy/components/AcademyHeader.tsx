"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, GraduationCap, LayoutDashboard } from "lucide-react";
import { Avatar, buttonClasses, cn, useScrolled } from "@da/ui";
import { visitorNav } from "@/lib/site";
import { AcademyLogo } from "./AcademyLogo";
import { LogoutButton } from "./LogoutButton";
import { NotificationBell } from "./NotificationBell";

const learnerLinks = [
  { label: "Catalogue", href: "/courses" },
  { label: "Mes cours", href: "/dashboard" },
  { label: "Certificats", href: "/certificates" },
];

export function AcademyHeader() {
  const pathname = usePathname();
  const scrolled = useScrolled(10);
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();
  const user = session?.user as
    | { name?: string | null; email?: string | null; roles?: string[] }
    | undefined;
  const roles = user?.roles ?? [];
  const isAdmin = roles.some((r) => r === "ADMIN" || r === "SUPER_ADMIN");
  const isInstructor = roles.includes("INSTRUCTOR") || isAdmin;
  // Destination « maison » adaptée au rôle (comme sur l'app web).
  const homeHref = isAdmin ? "/admin/dashboard" : isInstructor ? "/studio" : "/dashboard";

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

  const nav = user
    ? [
        ...learnerLinks,
        ...(isInstructor ? [{ label: "Studio", href: "/studio" }] : []),
        ...(isAdmin ? [{ label: "Admin", href: "/admin/dashboard" }] : []),
      ]
    : visitorNav;
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
      <div className="relative z-50 mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-3 sm:px-8 lg:px-10">
        <Link href="/" aria-label="Access Academy — accueil" className="shrink-0">
          <AcademyLogo size={38} />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
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

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
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
        <div className="flex items-center gap-1 lg:hidden">
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
              {nav.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-4 py-3 text-base font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-brand-blue-vif/10 text-brand-blue-royal"
                      : "text-navy hover:bg-navy/5",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                {user ? (
                  <>
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
