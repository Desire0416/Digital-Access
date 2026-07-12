import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { Container, StaggerGroup } from "@da/ui";
import { getSchools } from "@/lib/catalogue";
import { siteConfig } from "@/lib/site";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/EmptyState";
import { SchoolCard } from "@/components/cards";

/* ══════════════════════════════════════════════════════════════════════════
   Catalogue des écoles (cahier §14.2) — grille SchoolCard, chaque école avec
   son identité visuelle, ses compteurs et les métiers préparés. Une école
   regroupe des formations et parcours EXISTANTS par relation (§14.5), jamais
   des copies. Server Component.
   ══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Écoles — Explorez un domaine",
  description:
    "Découvrez les écoles Access Academy : développement, data & IA, design, marketing et plus. Chaque école regroupe des formations et des parcours métiers cohérents.",
  alternates: { canonical: `${siteConfig.url}/ecoles` },
  openGraph: {
    title: "Les écoles Access Academy",
    description: "Un domaine, une école : formations, parcours métiers et débouchés réunis autour d'une expertise.",
    url: `${siteConfig.url}/ecoles`,
    type: "website",
  },
};

export default async function SchoolsPage() {
  const schools = await getSchools();

  return (
    <div className="pb-24">
      {/* ── En-tête ── */}
      <section className="relative overflow-hidden border-b border-navy/[0.06] bg-surface-secondary/60">
        <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-da opacity-[0.08] blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4]" aria-hidden />
        <Container className="relative py-12 sm:py-16">
          <SectionHeading
            eyebrow="Écoles"
            title="Explorez un"
            gradient="domaine"
            subtitle="Chaque école Access Academy réunit, autour d'une expertise, ses formations et ses parcours métiers. Choisissez le domaine qui vous ressemble et suivez un itinéraire cohérent."
          />
        </Container>
      </section>

      <Container className="relative pt-10 sm:pt-14">
        {schools.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={44} className="text-brand-blue-royal/40" />}
            title="Aucune école disponible"
            description="Nos écoles seront bientôt en ligne. Revenez très prochainement."
            action={{ label: "Voir les formations", href: "/formations" }}
          />
        ) : (
          <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((s) => (
              <SchoolCard
                key={s.id}
                school={{
                  slug: s.slug,
                  name: s.name,
                  tagline: s.tagline,
                  description: s.description,
                  color: s.color,
                  icon: s.icon,
                  coverImage: s.coverImage,
                  courseCount: s.coursesCount,
                  pathCount: s.careerPathsCount,
                  jobs: s.jobs,
                }}
              />
            ))}
          </StaggerGroup>
        )}
      </Container>
    </div>
  );
}
