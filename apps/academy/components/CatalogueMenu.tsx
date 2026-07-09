"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Rocket, BookOpen, GraduationCap, ArrowRight, BadgeCheck, type LucideIcon } from "lucide-react";
import { cn } from "@da/ui";
import { catalogueMenu } from "@/lib/site";

const ICONS: Record<string, LucideIcon> = { rocket: Rocket, book: BookOpen, school: GraduationCap };
const CATALOGUE_HREFS = ["/career-paths", "/short-courses", "/schools", "/certifications"];

/** Méga-menu « Catalogue » du header (desktop) : survol + clic, fermeture propre. */
export function CatalogueMenu() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = CATALOGUE_HREFS.some((h) => pathname === h || pathname.startsWith(h + "/"));

  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
          active || open ? "text-brand-blue-royal" : "text-text-secondary hover:text-navy",
        )}
      >
        {catalogueMenu.label}
        <ChevronDown size={15} className={cn("transition-transform duration-200", open && "rotate-180")} />
        {active && (
          <motion.span
            layoutId="academy-nav-underline"
            className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-da"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-full z-50 mt-2 w-[26rem] -translate-x-1/2 overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary p-2 shadow-2xl"
          >
            <p className="px-3 pb-2 pt-1.5 text-xs leading-relaxed text-text-muted">{catalogueMenu.intro}</p>
            <div className="flex flex-col gap-0.5">
              {catalogueMenu.items.map((item) => {
                const Icon = ICONS[item.icon] ?? Rocket;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={cn(
                      "group/item flex items-start gap-3 rounded-xl p-3 transition-colors",
                      isActive ? "bg-brand-blue-vif/[0.06]" : "hover:bg-navy/[0.035]",
                    )}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 font-display text-sm font-bold text-navy">
                        {item.label}
                        <ArrowRight size={13} className="text-brand-blue-royal opacity-0 transition-all group-hover/item:translate-x-0.5 group-hover/item:opacity-100" />
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-text-secondary">{item.desc}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <Link
              href={catalogueMenu.secondary.href}
              role="menuitem"
              className="mt-1 flex items-center gap-2 rounded-xl border-t border-navy/[0.06] px-3 py-2.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:bg-navy/[0.035]"
            >
              <BadgeCheck size={16} /> {catalogueMenu.secondary.label}
              <ArrowRight size={13} className="ml-auto" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
