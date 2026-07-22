"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import { Logo, Avatar, buttonClasses, cn, useScrolled } from "@da/ui";
import { siteConfig, mainNav, clientNav } from "@/lib/site";
import { LogoutButton } from "./LogoutButton";

type HeaderUser = { name?: string | null; email?: string | null; roles?: string[] };

/* Icônes de marque (lucide v1 n'inclut plus les logos de réseaux). */
function FacebookIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function LinkedinIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

const SOCIALS = [
  { Icon: FacebookIcon, href: siteConfig.socials.facebook, label: "Facebook" },
  { Icon: InstagramIcon, href: siteConfig.socials.instagram, label: "Instagram" },
  { Icon: LinkedinIcon, href: siteConfig.socials.linkedin, label: "LinkedIn" },
];

export function SiteHeader({ initialUser }: { initialUser?: HeaderUser | null }) {
  const pathname = usePathname();
  const scrolled = useScrolled(10);
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();
  // Session serveur (initialUser, résolue par requête) prioritaire ; useSession
  // n'assure que les mises à jour réactives sans rechargement.
  const user = (session?.user as HeaderUser | undefined) ?? initialUser ?? undefined;
  const isClient = Boolean(user?.roles?.includes("CLIENT"));
  const isAdmin = Boolean(user?.roles?.some((r) => r === "ADMIN" || r === "SUPER_ADMIN"));
  const nav = isClient ? clientNav : mainNav;

  // Espaces connectés (portail client) : largeur d'application élargie.
  const PORTAL_PREFIXES = ["/mon-espace", "/mes-projets", "/factures", "/maintenance", "/support"];
  const isPortal = PORTAL_PREFIXES.some((p) => pathname.startsWith(p));
  const shellWidth = isPortal ? "max-w-[1600px]" : "max-w-7xl";

  // Accueil au repos : le header se pose en clair sur le hero sombre.
  const overHero = pathname === "/" && !scrolled && !open;

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* ═══ Barre utilitaire (contact + réseaux) — défile hors écran ═══ */}
      <div
        className={cn(
          "hidden overflow-hidden bg-navy text-white/75 transition-all duration-300 lg:block",
          scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100",
        )}
      >
        <div className={cn("mx-auto flex h-10 items-center justify-between gap-6 px-5 text-xs sm:px-8 lg:px-10", shellWidth)}>
          <div className="flex items-center gap-5">
            <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
              <Phone size={13} className="text-brand-cyan" />
              {siteConfig.contact.phone}
            </a>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-brand-cyan" />
              {siteConfig.contact.address}
            </span>
            <a href={`mailto:${siteConfig.contact.email}`} className="hidden items-center gap-1.5 transition-colors hover:text-white xl:inline-flex">
              <Mail size={13} className="text-brand-cyan" />
              {siteConfig.contact.email}
            </a>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="text-white/45">Suivez-nous</span>
            <div className="flex items-center gap-2.5">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-white/70 transition-colors hover:text-brand-cyan"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Header principal (sticky) ═══ */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled || open
            ? "border-b border-navy/[0.06] bg-surface-primary/90 shadow-[0_4px_24px_-12px_rgba(26,26,46,0.15)] backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <div className={cn("relative z-50 mx-auto flex h-18 items-center justify-between px-5 sm:px-8 lg:px-10", shellWidth)}>
          <Link href="/" aria-label="Digital Access — accueil" className="shrink-0">
            <Logo variant={overHero ? "white" : "color"} height={46} />
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? overHero
                      ? "text-white"
                      : "text-brand-blue-royal"
                    : overHero
                      ? "text-white/80 hover:text-white"
                      : "text-text-secondary hover:text-navy",
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className={cn(
                      "absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full",
                      overHero ? "bg-white" : "bg-gradient-da",
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                <Link
                  href={isAdmin ? "/admin/dashboard" : "/mon-espace"}
                  title="Accéder à mon tableau de bord"
                  className={cn(
                    buttonClasses({ variant: "ghost", size: "sm" }),
                    "gap-2",
                    overHero && "text-white hover:bg-white/10",
                  )}
                >
                  <Avatar name={user.name ?? user.email ?? "Vous"} className="h-7 w-7 text-xs" />
                  <span className="max-w-[10rem] truncate">{user.name ?? "Mon espace"}</span>
                </Link>
                <LogoutButton className={cn(overHero && "text-white hover:bg-white/10")} />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={cn(
                    buttonClasses({ variant: "ghost", size: "sm" }),
                    overHero && "text-white hover:bg-white/10",
                  )}
                >
                  Connexion
                </Link>
                <Link href="/devis" className={buttonClasses({ variant: "primary", size: "sm" })}>
                  Devis gratuit
                </Link>
              </>
            )}
          </div>

          {/* Toggle mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors lg:hidden",
              overHero ? "text-white hover:bg-white/10" : "text-navy hover:bg-navy/5",
            )}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu mobile — superposition */}
        <AnimatePresence>
          {open && (
            <>
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
              <motion.div
                key="menu-panel"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto bg-surface-primary shadow-xl lg:hidden"
              >
                <nav className={cn("mx-auto flex flex-col gap-1 px-5 py-4 sm:px-8", shellWidth)}>
                  {nav.map((item) => (
                    <Link
                      key={item.href}
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
                          href={isAdmin ? "/admin/dashboard" : "/mon-espace"}
                          className={cn(buttonClasses({ variant: "primary", size: "md" }), "gap-2")}
                        >
                          <Avatar name={user.name ?? user.email ?? "Vous"} className="h-6 w-6 text-[0.6rem]" />
                          {user.name ?? "Mon tableau de bord"}
                        </Link>
                        <LogoutButton variant="ghost" size="md" className="justify-center" />
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login" className={buttonClasses({ variant: "outline", size: "md" })}>
                          Connexion
                        </Link>
                        <Link href="/devis" className={buttonClasses({ variant: "primary", size: "md" })}>
                          Devis gratuit
                        </Link>
                      </>
                    )}
                  </div>
                  {/* Contact rapide dans le tiroir mobile */}
                  <div className="mt-4 flex flex-col gap-2 border-t border-navy/[0.06] pt-4 text-sm text-text-secondary">
                    <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:text-navy">
                      <Phone size={15} className="text-brand-blue-vif" />
                      {siteConfig.contact.phone}
                    </a>
                    <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-2 hover:text-navy">
                      <Mail size={15} className="text-brand-blue-vif" />
                      {siteConfig.contact.email}
                    </a>
                  </div>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
