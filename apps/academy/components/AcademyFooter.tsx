import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { AcademyLogo } from "./AcademyLogo";
import { academyConfig, footerNav } from "@/lib/site";

export function AcademyFooter() {
  return (
    <footer className="relative overflow-hidden bg-surface-dark text-white/70">
      <div className="h-1 w-full bg-gradient-da" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <AcademyLogo size={42} dark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              {academyConfig.tagline}. Apprenez les métiers du numérique à votre
              rythme, obtenez des certificats vérifiables et faites décoller
              votre carrière.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-sm">
              <a
                href={`mailto:${academyConfig.contact.email}`}
                className="flex items-center gap-2.5 text-white/60 transition-colors hover:text-brand-cyan"
              >
                <Mail size={15} className="text-brand-cyan" />
                {academyConfig.contact.email}
              </a>
              <a
                href={`https://wa.me/${academyConfig.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-white/60 transition-colors hover:text-brand-cyan"
              >
                <MessageCircle size={15} className="text-brand-cyan" />
                WhatsApp
              </a>
            </div>
          </div>

          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                {group.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {group.items.map((item) =>
                  item.href.startsWith("http") ? (
                    <li key={item.href + item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/60 transition-colors hover:text-brand-cyan"
                      >
                        {item.label}
                      </a>
                    </li>
                  ) : (
                    <li key={item.href + item.label}>
                      <Link
                        href={item.href}
                        className="text-sm text-white/60 transition-colors hover:text-brand-cyan"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Access Academy — un produit{" "}
            <a
              href={academyConfig.webUrl}
              className="font-semibold text-white/60 hover:text-brand-cyan"
            >
              Digital Access
            </a>
            . Tous droits réservés.
          </p>
          <p>Le numérique accessible, utile et stratégique.</p>
        </div>
      </div>
    </footer>
  );
}
