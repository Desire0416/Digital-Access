import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@da/ui";
import { siteConfig, footerNav } from "@/lib/site";

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function LinkedinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-surface-dark text-white/70">
      {/* Filet dégradé signature */}
      <div className="h-1 w-full bg-gradient-da" />
      {/* Halo décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-blue-royal/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="white" height={56} />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              {siteConfig.tagline}. Nous créons des sites et plateformes
              sur-mesure pour les entrepreneurs et institutions de Côte d'Ivoire.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: FacebookIcon, href: siteConfig.socials.facebook, label: "Facebook" },
                { icon: InstagramIcon, href: siteConfig.socials.instagram, label: "Instagram" },
                { icon: LinkedinIcon, href: siteConfig.socials.linkedin, label: "LinkedIn" },
              ].map(({ icon: SocialIcon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/70 transition-all hover:-translate-y-0.5 hover:bg-gradient-da hover:text-white"
                >
                  <SocialIcon size={18} />
                </a>
              ))}
            </div>
          </div>

          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                {group.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/60 transition-colors hover:text-brand-cyan"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="flex items-center gap-3 text-sm text-white/60 transition-colors hover:text-white"
          >
            <Mail size={16} className="text-brand-cyan" />
            {siteConfig.contact.email}
          </a>
          <div className="flex items-start gap-3 text-sm text-white/60">
            <Phone size={16} className="mt-0.5 shrink-0 text-brand-cyan" />
            <span className="flex flex-col gap-1">
              {siteConfig.contact.phones.map((tel) => (
                <a
                  key={tel}
                  href={`tel:${tel.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-white"
                >
                  {tel}
                </a>
              ))}
            </span>
          </div>
          <span className="flex items-center gap-3 text-sm text-white/60">
            <MapPin size={16} className="text-brand-cyan" />
            {siteConfig.contact.address}
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
          </p>
          <p>
            Conçu avec soin à Abidjan · Le numérique accessible, utile et
            stratégique.
          </p>
        </div>
      </div>
    </footer>
  );
}
