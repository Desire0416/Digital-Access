import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Users, Radio } from "lucide-react";
import { Section, Container, buttonClasses } from "@da/ui";
import { getAllOpenCohorts } from "@/lib/cohorts";
import { CohortOpenSessions } from "@/components/cohort/CohortOpenSessions";

export const metadata: Metadata = {
  title: "Cohortes en direct — apprenez en groupe, encadré·e",
  description:
    "Rejoignez une cohorte Access Academy : formation encadrée par un formateur, séances live, ateliers et projet réel, en groupe et à dates fixes. Places limitées.",
  alternates: { canonical: "/cohortes" },
};

/* Catalogue public des cohortes ouvertes à l'inscription (§23.4). */
export default async function CohortesPage() {
  const cohorts = await getAllOpenCohorts();

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <span className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-violet opacity-30 blur-[120px]" aria-hidden />
        <span className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-cyan opacity-20 blur-[120px]" aria-hidden />
        <Container className="relative py-16 text-center sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-sm font-medium text-white/85 backdrop-blur-sm">
            <Radio size={14} className="text-brand-cyan" />
            Sessions encadrées, en groupe
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Les cohortes en direct
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/75">
            Apprenez encadré·e par un formateur, avec des séances live, des ateliers pratiques et un
            projet réel — en groupe et à dates fixes. Les places sont limitées.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
            <span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-brand-cyan" /> Dates & rythme fixes</span>
            <span className="inline-flex items-center gap-2"><Users size={16} className="text-brand-cyan" /> Groupe à taille limitée</span>
            <span className="inline-flex items-center gap-2"><Radio size={16} className="text-brand-cyan" /> Séances live (Google Meet)</span>
          </div>
        </Container>
      </section>

      {/* ─── Liste des cohortes ouvertes ─── */}
      <Section tone="default" spacing="md">
        <Container>
          {cohorts.length > 0 ? (
            <>
              <p className="mb-6 text-sm font-medium text-text-secondary">
                {cohorts.length} cohorte{cohorts.length > 1 ? "s" : ""} ouverte
                {cohorts.length > 1 ? "s" : ""} à l'inscription
              </p>
              <CohortOpenSessions cohorts={cohorts} />
            </>
          ) : (
            <div className="mx-auto max-w-lg rounded-2xl border border-navy/[0.08] bg-surface-secondary/60 p-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
                <CalendarDays size={26} />
              </span>
              <h2 className="mt-5 font-display text-xl font-bold text-navy">
                Aucune cohorte ouverte pour le moment
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
                De nouvelles sessions encadrées ouvrent régulièrement. En attendant, explorez nos
                formations en accès libre.
              </p>
              <Link href="/formations" className={buttonClasses({ className: "mt-6" })}>
                Explorer les formations
              </Link>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
