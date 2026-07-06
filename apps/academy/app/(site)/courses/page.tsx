import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import {
  Badge,
  Container,
  Monogram,
  Reveal,
  Section,
  StaggerGroup,
  StaggerItem,
  buttonClasses,
} from "@da/ui";
import { getCategories, getCourses, type CourseFilters } from "@/lib/queries";
import { CourseCard } from "@/components/CourseCard";
import { CatalogueFilters } from "./CatalogueFilters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue des formations",
  description:
    "Explorez toutes les formations Access Academy : développement web, design UX/UI, marketing digital, bureautique… Filtrez par catégorie, niveau et prix, et apprenez à votre rythme.",
};

const LEVEL_VALUES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

interface CatalogueSearchParams {
  q?: string;
  category?: string;
  level?: string;
  price?: string;
  sort?: string;
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<CatalogueSearchParams>;
}) {
  const sp = await searchParams;

  /* Filtres assainis — l'URL est la source de vérité */
  const filters: CourseFilters = {
    q: sp.q?.trim() || undefined,
    category: sp.category || undefined,
    level:
      sp.level && (LEVEL_VALUES as readonly string[]).includes(sp.level)
        ? sp.level
        : undefined,
    price: sp.price === "free" || sp.price === "paid" ? sp.price : undefined,
    sort:
      sp.sort === "recent" || sp.sort === "rating" || sp.sort === "popular"
        ? sp.sort
        : undefined,
  };
  const hasFilters = Boolean(
    filters.q || filters.category || filters.level || filters.price,
  );

  const [courses, categories] = await Promise.all([
    getCourses(filters),
    getCategories(),
  ]);
  const count = courses.length;

  const countLabel =
    count === 0
      ? "Aucune formation trouvée"
      : `${count} formation${count > 1 ? "s" : ""} ${
          hasFilters
            ? count > 1
              ? "trouvées"
              : "trouvée"
            : count > 1
              ? "disponibles"
              : "disponible"
        }`;

  return (
    <>
      {/* ── En-tête compacte sur fond décoré (grille + halos) ─────────────── */}
      <div className="relative overflow-hidden border-b border-navy/[0.06] bg-surface-primary">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/[0.18] blur-[110px]" />
          <div className="absolute -top-16 right-[-5%] h-72 w-72 rounded-full bg-brand-cyan/20 blur-[110px]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface-primary to-transparent" />
        </div>

        <Container className="relative">
          <div className="flex items-center justify-between gap-10 py-12 sm:py-16">
            <div className="max-w-2xl">
              <Reveal y={16}>
                <span className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal">
                  <span aria-hidden className="h-px w-7 bg-gradient-da" />
                  Access Academy
                </span>
              </Reveal>
              <Reveal y={16} delay={0.08}>
                <h1 className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl">
                  Catalogue des <span className="text-gradient-da">formations</span>
                </h1>
              </Reveal>
              <Reveal y={16} delay={0.16}>
                <p className="mt-4 text-lg leading-relaxed text-text-secondary">
                  Développement web, design, marketing digital, bureautique… Des
                  parcours concrets construits par des experts, avec certificat
                  vérifiable à la clé.
                </p>
              </Reveal>
              <Reveal y={16} delay={0.24}>
                <Badge variant="soft" className="mt-5 px-3.5 py-1.5 text-sm">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
                  {countLabel}
                </Badge>
              </Reveal>
            </div>

            <Reveal delay={0.2} className="hidden shrink-0 lg:block">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 scale-125 rounded-full bg-gradient-da opacity-10 blur-2xl"
                />
                <Monogram size={128} className="relative opacity-90" />
              </div>
            </Reveal>
          </div>
        </Container>
      </div>

      {/* ── Filtres + grille de cours ──────────────────────────────────────── */}
      <Section tone="muted" spacing="sm" className="min-h-[55vh]">
        <Container>
          {/* Filtres : barre horizontale en haut (desktop) + tiroir (mobile) */}
          <Suspense fallback={null}>
            <CatalogueFilters
              categories={categories.filter((c) => c.courseCount > 0)}
              total={count}
            />
          </Suspense>

          {count > 0 ? (
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, i) => (
                <StaggerItem key={course.id} className="h-full">
                  <CourseCard course={course} index={i} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            /* État vide brandé — jamais une page blanche */
            <Reveal>
              <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-navy/15 bg-surface-primary px-8 py-14 text-center">
                <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-surface-secondary">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-2xl bg-gradient-da opacity-[0.08]"
                  />
                  <Monogram size={44} />
                </div>
                <h2 className="mt-6 font-display text-xl font-bold text-navy">
                  Aucune formation ne correspond
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Essayez d&apos;élargir votre recherche ou de retirer certains
                  filtres — de nouvelles formations arrivent régulièrement sur
                  Access Academy.
                </p>
                <Link
                  href="/courses"
                  className={buttonClasses({
                    variant: "primary",
                    size: "md",
                    className: "mt-6",
                  })}
                >
                  <RotateCcw size={16} aria-hidden />
                  Réinitialiser les filtres
                </Link>
              </div>
            </Reveal>
          )}
        </Container>
      </Section>
    </>
  );
}
