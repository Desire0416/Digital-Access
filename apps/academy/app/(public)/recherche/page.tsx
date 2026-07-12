import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Search, BookOpen, Route, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { Container, StaggerGroup, StaggerItem, Badge } from "@da/ui";
import { searchAll, type SearchResult } from "@/lib/catalogue";
import { siteConfig } from "@/lib/site";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "./SearchBar";

/* ══════════════════════════════════════════════════════════════════════════
   Recherche globale (cahier §32) — une seule barre qui interroge formations,
   parcours métiers et écoles. Server Component : relit q dans l'URL et appelle
   searchAll. Résultats regroupés par type en cartes DA, compteur, état vide
   brandé, état initial invitant à rechercher.
   ══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Recherche",
  description:
    "Recherchez dans tout Access Academy : formations, parcours métiers et écoles, par titre, métier ou compétence.",
  alternates: { canonical: `${siteConfig.url}/recherche` },
  robots: { index: false, follow: true },
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/* ─── Configuration d'affichage par type ──────────────────────────────────── */

const SECTION_META = {
  formation: {
    label: "Formations",
    singular: "formation",
    tag: "Formation",
    Icon: BookOpen,
    accent: "text-brand-blue-vif",
  },
  parcours: {
    label: "Parcours métiers",
    singular: "parcours",
    tag: "Parcours",
    Icon: Route,
    accent: "text-brand-violet",
  },
  ecole: {
    label: "Écoles",
    singular: "école",
    tag: "École",
    Icon: GraduationCap,
    accent: "text-brand-blue-royal",
  },
} as const;

const ORDER: (keyof typeof SECTION_META)[] = ["formation", "parcours", "ecole"];

/* ─── Carte de résultat (serveur-compatible) ──────────────────────────────── */

function ResultCard({ result }: { result: SearchResult }) {
  const meta = SECTION_META[result.type];
  const { Icon } = meta;
  // Angle déterministe pour varier les couvertures de repli.
  const hash = Array.from(result.title).reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = 115 + (hash % 50);

  return (
    <StaggerItem>
      <article className="group relative flex h-full overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary transition-shadow duration-300 hover:shadow-[0_18px_40px_-16px_rgba(43,58,140,0.28)]">
        <Link href={result.href} className="absolute inset-0 z-10" aria-label={`${meta.tag} : ${result.title}`} />

        {/* Vignette */}
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden sm:w-28">
          {result.image ? (
            <Image
              src={result.image}
              alt=""
              fill
              sizes="112px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="relative h-full w-full"
              style={{ background: `linear-gradient(${angle}deg, #5b3fa8 0%, #2b5cc6 40%, #1e8fe1 72%, #00bcd4 100%)` }}
              aria-hidden
            >
              <span className="absolute -right-4 -top-5 h-16 w-16 rounded-full border border-white/20" />
              <span className="absolute inset-0 grid place-items-center text-white/90">
                <Icon size={26} />
              </span>
            </div>
          )}
        </div>

        {/* Corps */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4 sm:p-5">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${meta.accent}`}>
            <Icon size={12} aria-hidden />
            {meta.tag}
          </span>
          <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug text-navy transition-colors group-hover:text-brand-blue-royal sm:text-base">
            {result.title}
          </h3>
          {result.subtitle && (
            <p className="line-clamp-1 text-xs leading-relaxed text-text-secondary sm:text-sm">{result.subtitle}</p>
          )}
        </div>

        {/* Chevron */}
        <span
          className="mr-4 hidden shrink-0 place-items-center self-center rounded-full bg-navy/[0.05] text-navy transition-all duration-300 group-hover:bg-gradient-da group-hover:text-white sm:grid sm:h-9 sm:w-9"
          aria-hidden
        >
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </article>
    </StaggerItem>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default async function RecherchePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const active = q.length >= 2;
  const results = active ? await searchAll(q) : [];

  const grouped = ORDER.map((type) => ({
    type,
    meta: SECTION_META[type],
    items: results.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="pb-24">
      {/* ── En-tête + barre ── */}
      <section className="relative overflow-hidden border-b border-navy/[0.06] bg-surface-secondary/60">
        <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-da opacity-[0.08] blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4]" aria-hidden />
        <Container className="relative py-12 sm:py-16">
          <SectionHeading
            eyebrow="Recherche"
            title="Trouvez votre"
            gradient="prochaine compétence"
            subtitle="Cherchez dans tout Access Academy : formations, parcours métiers et écoles, par titre, métier ou compétence."
          />
          <div className="mt-7 max-w-2xl">
            <SearchBar initialQuery={q} />
          </div>
        </Container>
      </section>

      <Container className="relative pt-10">
        {!active ? (
          /* ── État initial ── */
          <EmptyState
            icon={<Search size={44} className="text-brand-blue-royal/40" />}
            title="Que recherchez-vous ?"
            description="Saisissez au moins deux caractères pour explorer les formations, parcours et écoles de l'académie."
            action={{ label: "Parcourir le catalogue", href: "/formations" }}
          />
        ) : results.length === 0 ? (
          /* ── Aucun résultat ── */
          <EmptyState
            icon={<Search size={44} className="text-brand-blue-royal/40" />}
            title={`Aucun résultat pour « ${q} »`}
            description="Vérifiez l'orthographe ou essayez un terme plus général — un métier, une technologie ou une compétence."
            action={{ label: "Voir tout le catalogue", href: "/formations" }}
          />
        ) : (
          <div className="space-y-12">
            {/* Compteur */}
            <p className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Sparkles size={15} className="text-brand-blue-royal" aria-hidden />
              <span className="font-display font-bold text-navy">{results.length}</span>
              résultat{results.length > 1 ? "s" : ""} pour «&nbsp;
              <span className="font-semibold text-navy">{q}</span>&nbsp;»
            </p>

            {grouped.map((section) => {
              const { Icon } = section.meta;
              return (
                <section key={section.type}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-da text-white shadow-brand" aria-hidden>
                      <Icon size={18} />
                    </span>
                    <h2 className="font-display text-lg font-bold text-navy sm:text-xl">{section.meta.label}</h2>
                    <Badge variant="soft">{section.items.length}</Badge>
                  </div>
                  <StaggerGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {section.items.map((r) => (
                      <ResultCard key={`${r.type}-${r.href}`} result={r} />
                    ))}
                  </StaggerGroup>
                </section>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
