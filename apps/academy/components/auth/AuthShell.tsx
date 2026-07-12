import Link from "next/link";
import { Monogram } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille d'authentification split-screen brandée Digital Access (§15).
   Colonne visuelle dégradé DA + témoignage (masquée en mobile) ; colonne
   formulaire à droite. Cohérente sur connexion / inscription / vérification /
   mot de passe. Server Component (présentationnel, aucun hook).
   ══════════════════════════════════════════════════════════════════════════ */

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Aperçu du panneau visuel : accroche + puces mises en avant. */
  aside?: {
    heading: string;
    points: string[];
    quote?: { text: string; author: string; role: string };
  };
}

const DEFAULT_ASIDE = {
  heading: "Apprenez une compétence, préparez-vous à un métier.",
  points: [
    "Des formations pensées pour l'employabilité en Côte d'Ivoire",
    "Des projets concrets validés par des professionnels",
    "Des certificats vérifiables reconnus par les entreprises",
  ],
  quote: {
    text: "Access Academy m'a permis de décrocher mon premier emploi dans la data en trois mois.",
    author: "Aïcha K.",
    role: "Analyste de données, promotion 2025",
  },
};

export function AuthShell({ title, subtitle, children, footer, aside }: AuthShellProps) {
  const panel = aside ?? DEFAULT_ASIDE;

  return (
    <div className="grid grid-cols-1 min-h-[calc(100vh-4rem)] w-full lg:grid-cols-[1.05fr_1fr]">
      {/* Colonne visuelle — dégradé signature, masquée en mobile */}
      <aside className="relative hidden overflow-hidden bg-gradient-da px-12 py-16 lg:flex lg:flex-col lg:justify-between">
        {/* Formes géométriques abstraites */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-cyan/30 blur-3xl" />
          <div className="absolute right-16 top-1/3 h-40 w-40 rotate-12 rounded-3xl border border-white/20" />
          <div className="absolute left-10 bottom-1/4 h-24 w-24 rounded-2xl border border-white/20" />
        </div>

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            <Monogram size={40} variant="white" />
            <span className="font-display text-lg font-bold tracking-tight">Access Academy</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            {panel.heading}
          </h2>
          <ul className="mt-8 space-y-4">
            {panel.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-white/90">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 20 20" className="h-3 w-3 fill-white">
                    <path d="M7.5 13.5 4 10l1.4-1.4 2.1 2.1 5.1-5.1L14 7z" />
                  </svg>
                </span>
                <span className="text-sm leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {panel.quote && (
          <figure className="relative max-w-md rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
            <blockquote className="text-sm leading-relaxed text-white">
              « {panel.quote.text} »
            </blockquote>
            <figcaption className="mt-3 text-xs text-white/75">
              <span className="font-semibold text-white">{panel.quote.author}</span> — {panel.quote.role}
            </figcaption>
          </figure>
        )}
      </aside>

      {/* Colonne formulaire */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* Logo mobile (la colonne visuelle est masquée) */}
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5 text-navy lg:hidden">
            <Monogram size={34} />
            <span className="font-display text-base font-bold tracking-tight">Access Academy</span>
          </Link>

          <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-text-secondary">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 text-center text-sm text-text-secondary">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
