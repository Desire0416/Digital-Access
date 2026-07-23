import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CalendarClock,
  Users,
  GraduationCap,
  Radio,
  MapPin,
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  ClipboardList,
  CircleDot,
} from "lucide-react";
import {
  Section,
  Container,
  Badge,
  Reveal,
  StaggerGroup,
  StaggerItem,
  GradientText,
  cn,
  buttonClasses,
} from "@da/ui";
import type { CohortType, EventType } from "@da/academy-db/client";
import { getPublicCohortBySlug, type PublicCohortSession } from "@/lib/cohorts";
import { formatFCFA } from "@/lib/site";
import { Markdown } from "@/components/Markdown";
import { CohortEnrollButton } from "@/components/cohort/CohortEnrollButton";

const TZ = "Africa/Abidjan";

const TYPE_LABEL: Record<CohortType, string> = {
  AUTONOMOUS: "Autonome",
  GUIDED: "Accompagnée",
  INTENSIVE: "Intensive",
  ENTERPRISE: "Entreprise",
  HYBRID: "Hybride",
  VIRTUAL_CLASS: "Classe virtuelle",
};

const EVENT_LABEL: Record<EventType, string> = {
  WEBINAR: "Webinaire",
  VIRTUAL_CLASS: "Classe virtuelle",
  WORKSHOP: "Atelier",
  DEFENSE: "Soutenance",
  MENTORING: "Mentorat",
  CONFERENCE: "Conférence",
  QA_SESSION: "Questions-réponses",
};

const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "long", timeZone: TZ });
const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

/* Ne capitalise QUE la 1re lettre (le jour) — `capitalize` CSS mettrait aussi
   le mois en majuscule (« Mardi 04 Août »), incorrect en français. */
const capFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cohort = await getPublicCohortBySlug(slug);
  if (!cohort) return { title: "Cohorte introuvable" };
  const desc =
    cohort.courseSubtitle ??
    (cohort.description ? cohort.description.split("\n")[0] : "Rejoignez cette cohorte encadrée Access Academy.");
  return {
    title: `${cohort.name} — Cohorte`,
    description: desc.slice(0, 160),
    alternates: { canonical: `/cohortes/${cohort.slug}` },
  };
}

function SessionRow({ session, last }: { session: PublicCohortSession; last: boolean }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {/* Ligne + pastille */}
      <div className="relative flex flex-col items-center">
        <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-da text-white shadow-brand">
          {session.online ? <Radio size={15} aria-hidden /> : <MapPin size={15} aria-hidden />}
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-navy/10" aria-hidden />}
      </div>
      {/* Contenu */}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{EVENT_LABEL[session.type] ?? session.type}</Badge>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold",
              session.online ? "text-brand-blue-royal" : "text-accent",
            )}
          >
            {session.online ? <Radio size={11} aria-hidden /> : <MapPin size={11} aria-hidden />}
            {session.online ? "En ligne (Google Meet)" : "Présentiel — Abidjan"}
          </span>
        </div>
        <p className="mt-1.5 font-display text-sm font-bold text-navy">{session.title}</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          {capFirst(dayFmt.format(session.startAt))} · {timeFmt.format(session.startAt)}
          {session.endAt ? ` – ${timeFmt.format(session.endAt)}` : ""}
        </p>
      </div>
    </li>
  );
}

export default async function CohortDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cohort = await getPublicCohortBySlug(slug);
  if (!cohort) notFound();

  const isFree = cohort.effectivePrice === 0;
  const teaser = cohort.courseSubtitle ?? cohort.description?.split("\n")[0] ?? null;

  return (
    <>
      {/* ─────────────────────────── Hero (navy) ─────────────────────────── */}
      <section className="relative overflow-hidden bg-surface-dark text-white">
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <span className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-violet opacity-30 blur-[120px]" aria-hidden />
        <span className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-cyan opacity-20 blur-[120px]" aria-hidden />

        <Container className="relative py-12 sm:py-16">
          <Link
            href="/cohortes"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={15} aria-hidden />
            Toutes les cohortes
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gradient">{TYPE_LABEL[cohort.type] ?? cohort.type}</Badge>
                {cohort.code && <Badge variant="outline">{cohort.code}</Badge>}
                {cohort.isFull && <Badge variant="warning">Complète</Badge>}
              </div>

              <h1 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {cohort.name}
              </h1>
              {teaser && <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75">{teaser}</p>}

              {/* Méta */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-white/75">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={16} className="text-brand-cyan" aria-hidden />
                  {cohort.endDate
                    ? `Du ${dateFmt.format(cohort.startDate)} au ${dateFmt.format(cohort.endDate)}`
                    : `À partir du ${dateFmt.format(cohort.startDate)}`}
                </span>
                {cohort.rhythm && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarClock size={16} className="text-brand-cyan" aria-hidden />
                    {cohort.rhythm}
                  </span>
                )}
                <span className={cn("inline-flex items-center gap-2", cohort.isFull && "font-semibold text-warning")}>
                  <Users size={16} className={cohort.isFull ? "text-warning" : "text-brand-cyan"} aria-hidden />
                  {cohort.capacity == null
                    ? "Places illimitées"
                    : cohort.isFull
                      ? "Complète"
                      : `${cohort.seatsLeft} place${(cohort.seatsLeft ?? 0) > 1 ? "s" : ""} restante${(cohort.seatsLeft ?? 0) > 1 ? "s" : ""} / ${cohort.capacity}`}
                </span>
              </div>

              {cohort.instructors.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/80">
                  <GraduationCap size={16} className="text-brand-violet" aria-hidden />
                  {cohort.instructors.map((ins, i) => (
                    <span key={i}>
                      <span className="font-semibold text-white">{ins.name}</span>
                      <span className="text-white/55"> · {ins.roleLabel}</span>
                    </span>
                  ))}
                </div>
              )}

              {cohort.target && (
                <Link
                  href={cohort.target.kind === "course" ? `/formations/${cohort.target.slug}` : `/parcours/${cohort.target.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-sm transition-colors hover:border-white/30 hover:text-white"
                >
                  <BookOpenCheck size={13} className="text-brand-cyan" aria-hidden />
                  {cohort.target.kind === "course" ? "Voir la formation" : "Voir le parcours"} : {cohort.target.title}
                  <ArrowUpRight size={13} aria-hidden />
                </Link>
              )}
            </div>

            {/* Prix + CTA (desktop) */}
            <div className="hidden w-64 shrink-0 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm lg:block">
              <p className="text-xs font-medium uppercase tracking-wide text-white/55">Tarif de la cohorte</p>
              <p className={cn("mt-1 font-display text-3xl font-extrabold", isFree ? "text-brand-cyan" : "text-white")}>
                {isFree ? "Gratuit" : formatFCFA(cohort.effectivePrice)}
              </p>
              <CohortEnrollButton
                cohortId={cohort.id}
                slug={cohort.slug}
                effectivePrice={cohort.effectivePrice}
                isFull={cohort.isFull}
                className="mt-4"
              />
              {cohort.enrollmentDeadline && (
                <p className="mt-3 text-center text-[11px] font-medium text-warning">
                  Clôture des inscriptions le {dateFmt.format(cohort.enrollmentDeadline)}
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────── Corps ─────────────────────────── */}
      <Section tone="default" spacing="md">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
            {/* Colonne principale */}
            <div className="min-w-0 space-y-12">
              {/* Présentation */}
              {cohort.description && (
                <Reveal>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-navy">
                      <GradientText>Présentation</GradientText> de la cohorte
                    </h2>
                    <div className="mt-4">
                      <Markdown>{cohort.description}</Markdown>
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Calendrier des rendez-vous live */}
              {cohort.sessions.length > 0 && (
                <Reveal>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-navy">Les rendez-vous live d'accompagnement</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                      La formation se suit en autonomie ; ces rencontres régulières vous permettent de poser vos
                      questions, de faire relire vos productions et de garder le rythme. Le lien de connexion est
                      communiqué aux inscrits avant chaque séance.
                    </p>
                    <ul className="mt-6">
                      {cohort.sessions.map((s, i) => (
                        <SessionRow key={s.id} session={s} last={i === cohort.sessions.length - 1} />
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}

              {/* Conditions, organisation & validation */}
              {cohort.rules && (
                <Reveal>
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-navy">
                      <ClipboardList size={22} className="text-brand-blue-royal" aria-hidden />
                      Conditions & validation
                    </h2>
                    <div className="mt-4 rounded-2xl border border-navy/[0.08] bg-surface-secondary/50 p-6 sm:p-8">
                      <Markdown>{cohort.rules}</Markdown>
                    </div>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Sidebar récap (sticky) */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Tarif</p>
                <p className={cn("mt-1 font-display text-3xl font-extrabold", isFree ? "text-success" : "text-navy")}>
                  {isFree ? "Gratuit" : formatFCFA(cohort.effectivePrice)}
                </p>

                <CohortEnrollButton
                  cohortId={cohort.id}
                  slug={cohort.slug}
                  effectivePrice={cohort.effectivePrice}
                  isFull={cohort.isFull}
                  className="mt-4"
                />

                <StaggerGroup>
                  <dl className="mt-6 space-y-3.5 text-sm">
                    <StaggerItem>
                      <div className="flex items-start gap-3">
                        <CalendarDays size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                        <div>
                          <dt className="font-semibold text-navy">Dates</dt>
                          <dd className="text-text-secondary">
                            {cohort.endDate
                              ? `${dateFmt.format(cohort.startDate)} → ${dateFmt.format(cohort.endDate)}`
                              : `À partir du ${dateFmt.format(cohort.startDate)}`}
                          </dd>
                        </div>
                      </div>
                    </StaggerItem>
                    {cohort.rhythm && (
                      <StaggerItem>
                        <div className="flex items-start gap-3">
                          <CalendarClock size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                          <div>
                            <dt className="font-semibold text-navy">Rythme</dt>
                            <dd className="text-text-secondary">{cohort.rhythm}</dd>
                          </div>
                        </div>
                      </StaggerItem>
                    )}
                    <StaggerItem>
                      <div className="flex items-start gap-3">
                        <Users size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                        <div>
                          <dt className="font-semibold text-navy">Places</dt>
                          <dd className={cn("text-text-secondary", cohort.isFull && "font-semibold text-error")}>
                            {cohort.capacity == null
                              ? "Illimitées"
                              : cohort.isFull
                                ? "Cohorte complète"
                                : `${cohort.seatsLeft} / ${cohort.capacity} restantes`}
                          </dd>
                        </div>
                      </div>
                    </StaggerItem>
                    {cohort.enrollmentDeadline && (
                      <StaggerItem>
                        <div className="flex items-start gap-3">
                          <CircleDot size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                          <div>
                            <dt className="font-semibold text-navy">Clôture des inscriptions</dt>
                            <dd className="text-text-secondary">{dateFmt.format(cohort.enrollmentDeadline)}</dd>
                          </div>
                        </div>
                      </StaggerItem>
                    )}
                    {cohort.target && (
                      <StaggerItem>
                        <div className="flex items-start gap-3">
                          <BookOpenCheck size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                          <div>
                            <dt className="font-semibold text-navy">Formation ciblée</dt>
                            <dd>
                              <Link
                                href={cohort.target.kind === "course" ? `/formations/${cohort.target.slug}` : `/parcours/${cohort.target.slug}`}
                                className="inline-flex items-center gap-1 font-medium text-brand-blue-royal hover:text-brand-violet"
                              >
                                {cohort.target.title}
                                <ArrowUpRight size={13} aria-hidden />
                              </Link>
                            </dd>
                          </div>
                        </div>
                      </StaggerItem>
                    )}
                  </dl>
                </StaggerGroup>

                <p className="mt-6 border-t border-navy/[0.07] pt-4 text-xs leading-relaxed text-text-muted">
                  Une question avant de vous lancer ?{" "}
                  <Link href="/evenements" className="font-medium text-brand-blue-royal hover:text-brand-violet">
                    Participez à la session d'info
                  </Link>{" "}
                  ou{" "}
                  <Link href="/contact" className="font-medium text-brand-blue-royal hover:text-brand-violet">
                    contactez-nous
                  </Link>
                  .
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
