import * as React from "react";
import Link from "next/link";
import { MessagesSquare, Lock, MailWarning } from "lucide-react";
import { Badge, Container, GradientText, Monogram, buttonClasses, cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Fragments partagés de l'espace communauté (forum).
   États d'accès brandés + surlignage des @mentions.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Découpe un texte brut et rend les @mentions (lettres/chiffres/points/tirets)
 * en gras coloré, sans casser le reste du contenu. Helper local léger.
 */
export function renderWithMentions(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /@[A-Za-z0-9._-]+/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span key={`m-${key++}`} className="font-semibold text-brand-blue-royal">
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Rend un texte multi-lignes avec mentions surlignées (préserve les sauts de ligne). */
export function MentionText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div className={cn("whitespace-pre-wrap break-words leading-relaxed text-navy/85", className)}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {renderWithMentions(line)}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * État plein écran affiché quand l'utilisateur n'est pas inscrit au cours.
 * Invite à rejoindre le cours pour accéder à la communauté.
 */
export function AccessGate({ slug, courseTitle }: { slug: string; courseTitle: string }) {
  return (
    <Container size="sm" className="py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-8 text-center sm:p-14">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-[0.12]" />
        <Monogram
          variant="gradient"
          size={72}
          className="mx-auto mb-6 opacity-90"
        />
        <span className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-da text-white shadow-brand">
          <Lock size={26} />
        </span>
        <h2 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          Espace réservé aux inscrits
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-text-secondary">
          Rejoignez <span className="font-semibold text-navy">{courseTitle}</span> pour poser vos
          questions, échanger avec les autres apprenants et l&apos;instructeur dans le forum du cours.
        </p>
        <Link
          href={`/courses/${slug}`}
          className={cn(buttonClasses({ variant: "primary", size: "lg" }), "mt-8")}
        >
          Rejoindre le cours
        </Link>
      </div>
    </Container>
  );
}

/**
 * Bandeau affiché aux utilisateurs qui peuvent lire mais pas publier
 * (email non vérifié). Remplace les formulaires de participation.
 */
export function EmailVerifyBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/[0.07] p-4 sm:flex-row sm:items-center sm:gap-4",
        className,
      )}
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-[#B45309]">
        <MailWarning size={20} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-navy">Confirmez votre email pour participer</p>
        <p className="mt-0.5 text-sm text-text-secondary">
          Vous pouvez lire les échanges. Vérifiez votre adresse pour publier des sujets, répondre et
          voter.
        </p>
      </div>
      <Link
        href="/auth/verify-email"
        className={cn(buttonClasses({ variant: "outline", size: "sm" }), "shrink-0")}
      >
        Renvoyer l&apos;email
      </Link>
    </div>
  );
}

/** En-tête de section commun aux pages communauté (fil d'ariane + titre dégradé). */
export function CommunityHeader({
  slug,
  courseTitle,
  eyebrow,
  title,
  subtitle,
  backLabel = "Retour au cours",
}: {
  slug: string;
  courseTitle: string;
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  backLabel?: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-navy/[0.07] bg-surface-secondary">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-gradient-da opacity-[0.08] blur-3xl"
      />
      <Container className="relative py-10 sm:py-14">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/courses/${slug}`}
            className="inline-flex items-center gap-1 font-medium text-text-secondary transition-colors hover:text-brand-blue-royal"
          >
            <span aria-hidden>&larr;</span> {backLabel}
          </Link>
        </div>
        {eyebrow && (
          <div className="mt-4 flex items-center gap-2">
            <span aria-hidden className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-da text-white shadow-brand">
              <MessagesSquare size={16} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-text-secondary">
            {subtitle}
          </p>
        )}
      </Container>
    </div>
  );
}

/** Badge « Instructeur » réutilisable. */
export function InstructorBadge() {
  return (
    <Badge variant="gradient" className="px-2 py-0.5 text-[0.65rem]">
      Instructeur
    </Badge>
  );
}

/** Pastille « Résolu » verte. */
export function SolvedPill({ className }: { className?: string }) {
  return (
    <Badge variant="success" className={cn("gap-1", className)}>
      Résolu
    </Badge>
  );
}

export { GradientText };
