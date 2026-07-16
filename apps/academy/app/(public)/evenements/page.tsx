import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CalendarClock,
  Sparkles,
  History,
  Video,
  MonitorPlay,
  Wrench,
  GraduationCap,
  UserCheck,
  Presentation,
  HelpCircle,
} from "lucide-react";
import { Container, StaggerGroup, Badge } from "@da/ui";
import type { EventType } from "@da/academy-db/client";
import { getPublicEvents } from "@/lib/events";
import { siteConfig } from "@/lib/site";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/event/EventCard";

/* ══════════════════════════════════════════════════════════════════════════
   Agenda public des événements (cahier §24) — hero brandé, filtre par type,
   section « À venir » et « Replays & passés », grilles en cascade. Server
   Component : relit le searchParam `type` et re-requête à chaque changement.
   ══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Événements — Webinaires, ateliers et classes virtuelles",
  description:
    "Participez aux événements Access Academy en direct : webinaires, ateliers pratiques, classes virtuelles, mentorat et conférences. Inscription gratuite, rappels et replays.",
  alternates: { canonical: `${siteConfig.url}/evenements` },
  openGraph: {
    title: "Événements Access Academy",
    description: "Webinaires, ateliers, classes virtuelles et conférences — en direct et en replay.",
    url: `${siteConfig.url}/evenements`,
    type: "website",
  },
};

const TYPE_LABEL: Record<EventType, string> = {
  WEBINAR: "Webinaires",
  VIRTUAL_CLASS: "Classes virtuelles",
  WORKSHOP: "Ateliers",
  DEFENSE: "Soutenances",
  MENTORING: "Mentorat",
  CONFERENCE: "Conférences",
  QA_SESSION: "Questions-réponses",
};

const TYPE_ICON: Record<EventType, React.ComponentType<{ size?: number; className?: string }>> = {
  WEBINAR: Video,
  VIRTUAL_CLASS: MonitorPlay,
  WORKSHOP: Wrench,
  DEFENSE: GraduationCap,
  MENTORING: UserCheck,
  CONFERENCE: Presentation,
  QA_SESSION: HelpCircle,
};

const VALID_TYPES: EventType[] = [
  "WEBINAR",
  "VIRTUAL_CLASS",
  "WORKSHOP",
  "DEFENSE",
  "MENTORING",
  "CONFERENCE",
  "QA_SESSION",
];

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/* ─── Puce de filtre (URL-driven) ──────────────────────────────────────────── */
function TypeChip({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full bg-gradient-da px-3.5 py-1.5 text-xs font-semibold text-white shadow-brand"
          : "inline-flex items-center gap-1.5 rounded-full border border-navy/10 bg-surface-primary px-3.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
      }
      aria-current={active ? "page" : undefined}
    >
      {Icon && <Icon size={13} aria-hidden />}
      {label}
    </Link>
  );
}

export default async function EvenementsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const typeRaw = one(sp.type);
  const type = typeRaw && VALID_TYPES.includes(typeRaw as EventType) ? (typeRaw as EventType) : undefined;

  const { upcoming, past } = await getPublicEvents({ type });

  const chipHref = (t?: EventType) => (t ? `/evenements?type=${t}` : "/evenements");

  return (
    <div className="pb-24">
      {/* ══════════════════ Hero navy ══════════════════ */}
      <section className="relative overflow-hidden bg-navy text-white">
        <span className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-violet/30 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15]" aria-hidden />
        {/* Composition : calendrier flottant */}
        <span className="pointer-events-none absolute -right-6 top-10 hidden rotate-6 opacity-20 sm:block" aria-hidden>
          <CalendarDays size={180} className="text-brand-cyan" strokeWidth={1} />
        </span>

        <Container className="relative py-12 sm:py-16">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm">
            <CalendarClock size={13} className="text-brand-cyan" aria-hidden />
            Agenda Access Academy
          </span>
          <h1 className="max-w-3xl font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            Apprenez en direct, échangez et repartez avec du concret
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Webinaires, ateliers pratiques, classes virtuelles, mentorat et conférences animés par nos formateurs.
            Inscription gratuite, rappel avant le début et replays pour ne rien manquer.
          </p>

          {/* Compteur */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={15} className="text-brand-cyan" aria-hidden />
              <span className="font-semibold text-white">{upcoming.length}</span> événement
              {upcoming.length > 1 ? "s" : ""} à venir
            </span>
            {past.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <History size={15} aria-hidden />
                <span className="font-semibold text-white">{past.length}</span> en replay
              </span>
            )}
          </div>
        </Container>
      </section>

      <Container className="relative">
        {/* ── Filtre par type ── */}
        <div className="flex flex-wrap gap-2 pt-6">
          <TypeChip href={chipHref()} active={!type} label="Tous les événements" />
          {VALID_TYPES.map((t) => (
            <TypeChip key={t} href={chipHref(t)} active={type === t} icon={TYPE_ICON[t]} label={TYPE_LABEL[t]} />
          ))}
        </div>

        {/* ══════════════════ À venir ══════════════════ */}
        <section className="mt-10">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-da text-white shadow-brand" aria-hidden>
              <Sparkles size={18} />
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">À venir</h2>
            {upcoming.length > 0 && <Badge variant="soft">{upcoming.length}</Badge>}
          </div>

          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={44} className="text-brand-blue-royal/40" />}
              title="Aucun événement à venir pour l'instant"
              description={
                type
                  ? "Aucun événement de ce type n'est programmé. Explorez tous les événements ou revenez bientôt."
                  : "De nouveaux webinaires et ateliers sont programmés régulièrement. Revenez bientôt ou explorez les replays."
              }
              action={type ? { label: "Voir tous les événements", href: "/evenements" } : undefined}
            />
          ) : (
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </StaggerGroup>
          )}
        </section>

        {/* ══════════════════ Replays & passés ══════════════════ */}
        {past.length > 0 && (
          <section className="mt-14">
            <div className="mb-6 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy text-white" aria-hidden>
                <History size={18} />
              </span>
              <h2 className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">Replays & passés</h2>
            </div>
            <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((ev) => (
                <EventCard key={ev.id} event={ev} past />
              ))}
            </StaggerGroup>
          </section>
        )}
      </Container>
    </div>
  );
}
