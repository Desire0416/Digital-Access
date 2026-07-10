import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban, Sparkles, ArrowRight, LayoutDashboard } from "lucide-react";
import { Container, Section, IconBadge, buttonClasses, cn } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getClientProjects } from "@/lib/portal-queries";
import { PageHero } from "@/components/PageHero";
import { ProjectGrid } from "./ProjectGrid";

export const metadata: Metadata = {
  title: "Mes projets",
  description: "Suivez l'avancement de vos projets avec Digital Access.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MesProjetsPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/mes-projets");

  const projects = await getClientProjects(user.id);
  const hasProjects = projects.length > 0;
  const activeCount = projects.filter(
    (p) => !["DELIVERED", "ARCHIVED"].includes(p.status),
  ).length;

  return (
    <>
      <PageHero
        eyebrow="Espace client"
        title="Mes projets"
        description={
          hasProjects
            ? "Suivez l'avancement de chaque projet, étape par étape, en temps réel."
            : "Retrouvez ici tous vos projets confiés à Digital Access."
        }
      >
        <Link
          href="/mon-espace"
          className={buttonClasses({ variant: "outline", size: "md" })}
        >
          <LayoutDashboard size={17} />
          Tableau de bord
        </Link>
        <Link href="/devis" className={buttonClasses({ variant: "primary", size: "md" })}>
          Nouveau projet
          <ArrowRight size={17} />
        </Link>
      </PageHero>

      <Section spacing="lg" className="pt-0">
        <Container size="full">
          {hasProjects ? (
            <>
              {/* Résumé */}
              <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                <span className="inline-flex items-center gap-2 rounded-full border border-navy/[0.08] bg-surface-primary px-4 py-1.5 font-medium">
                  <FolderKanban size={15} className="text-brand-blue-royal" />
                  {projects.length} projet{projects.length > 1 ? "s" : ""} au total
                </span>
                {activeCount > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-4 py-1.5 font-medium text-brand-blue-royal">
                    <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
                    {activeCount} en cours
                  </span>
                )}
              </div>

              <ProjectGrid projects={projects} />
            </>
          ) : (
            /* État vide brandé */
            <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/50 p-12 text-center">
              <IconBadge tone="gradient" size="lg" className="mx-auto">
                <Sparkles size={26} />
              </IconBadge>
              <h2 className="mt-5 font-display text-2xl font-bold text-navy">
                Aucun projet pour le moment
              </h2>
              <p className="mx-auto mt-2 max-w-md text-text-secondary">
                Vous n'avez pas encore de projet en cours avec Digital Access.
                Demandez un devis gratuit et suivez son avancement pas à pas
                depuis votre espace.
              </p>
              <Link
                href="/devis"
                className={cn(buttonClasses({ variant: "primary", size: "lg" }), "mt-7")}
              >
                Demander un devis
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
