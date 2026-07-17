import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Mail, ExternalLink } from "lucide-react";
import { siteConfig } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Pied de page Access Academy — navy profond, accent dégradé signature.
   4 colonnes : marque · Explorer · Compte · Digital Access + barre légale.
   ══════════════════════════════════════════════════════════════════════════ */

const exploreLinks = [
  { label: "Formations", href: "/formations" },
  { label: "Parcours métiers", href: "/parcours-metiers" },
  { label: "Écoles", href: "/ecoles" },
  { label: "Événements", href: "/evenements" },
  { label: "Certifications", href: "/certifications" },
  { label: "Vérifier un certificat", href: "/certificats/verifier" },
] as const;

const accountLinks = [
  { label: "Se connecter", href: "/connexion" },
  { label: "Créer un compte", href: "/inscription" },
  { label: "Mon espace", href: "/espace" },
  { label: "Mes certificats", href: "/espace/certificats" },
  { label: "Centre d'aide", href: "/aide" },
  { label: "Support", href: "/espace/support" },
] as const;

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
    >
      <span className="h-px w-0 bg-gradient-da transition-all duration-300 group-hover:w-3" aria-hidden />
      {children}
    </Link>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const whatsappHref = `https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, "")}`;

  return (
    <footer className="relative overflow-x-clip bg-surface-dark text-white">
      {/* Filet dégradé signature en tête de footer */}
      <span className="block h-1 w-full bg-gradient-da" aria-hidden />

      {/* Halo décoratif */}
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-gradient-da opacity-[0.08] blur-3xl"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* ── Marque ── */}
          <div>
            <Link href="/" aria-label="Access Academy — accueil" className="inline-flex">
              {/* Logo à fond transparent → silhouette blanche sur le footer sombre. */}
              <Image
                src="/logo-access-academy.png"
                alt="Access Academy"
                width={200}
                height={193}
                className="h-20 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{siteConfig.description}</p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-all hover:border-brand-cyan/60 hover:bg-white/[0.04]"
            >
              <MessageCircle size={15} className="text-brand-cyan" aria-hidden />
              Discuter sur WhatsApp
            </a>
          </div>

          {/* ── Explorer ── */}
          <nav aria-label="Explorer">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-white/85">Explorer</h3>
            <span className="mt-2 block h-0.5 w-8 rounded-full bg-gradient-da" aria-hidden />
            <ul className="mt-4 space-y-2.5">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Compte ── */}
          <nav aria-label="Compte">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-white/85">Compte</h3>
            <span className="mt-2 block h-0.5 w-8 rounded-full bg-gradient-da" aria-hidden />
            <ul className="mt-4 space-y-2.5">
              {accountLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Digital Access ── */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-white/85">
              Digital Access
            </h3>
            <span className="mt-2 block h-0.5 w-8 rounded-full bg-gradient-da" aria-hidden />
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Access Academy est l&apos;académie numérique de {siteConfig.legalName}, agence digitale basée à Abidjan,
              Côte d&apos;Ivoire.
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href={siteConfig.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                >
                  <ExternalLink size={13} className="text-brand-cyan" aria-hidden />
                  digitalaccess.ci
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                >
                  <Mail size={13} className="text-brand-cyan" aria-hidden />
                  {siteConfig.contactEmail}
                </a>
              </li>
              <li>
                <FooterLink href="/entreprises">Offre entreprises</FooterLink>
              </li>
              <li>
                <FooterLink href="/contact">Nous contacter</FooterLink>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Barre légale ── */}
      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-white/45">
            © {year} {siteConfig.legalName} — Access Academy. Tous droits réservés.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/45">
            <Link href="/a-propos" className="transition-colors hover:text-white">
              À propos
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white">
              Contact
            </Link>
            <a
              href={siteConfig.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Site Digital Access
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
