import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Home,
  ChevronRight,
  CalendarClock,
  Clock,
  Users,
  Video,
  MonitorPlay,
  Wrench,
  GraduationCap,
  UserCheck,
  Presentation,
  HelpCircle,
  MapPin,
  Sparkles,
  FileText,
  ClipboardList,
  PlayCircle,
  Mic2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Container, Badge } from "@da/ui";
import type { EventType, EventProvider } from "@da/academy-db/client";
import { getEventBySlug } from "@/lib/events";
import { currentUser } from "@/lib/guards";
import { siteConfig } from "@/lib/site";
import { Markdown } from "@/components/Markdown";
import { EventRegisterButton } from "@/components/event/EventRegisterButton";

/* ══════════════════════════════════════════════════════════════════════════
   Fiche événement (cahier §24.2) — hero navy, colonne d'inscription sticky,
   sections description / intervenant / ressources / compte rendu / replay.
   Le lien de connexion (meetingUrl) n'est fourni par le serveur qu'aux inscrits.
   JSON-LD Event échappé (anti-XSS). Fuseau propre à l'événement.
   ══════════════════════════════════════════════════════════════════════════ */

const TZ = "Africa/Abidjan";

const TYPE_LABEL: Record<EventType, string> = {
  WEBINAR: "Webinaire",
  VIRTUAL_CLASS: "Classe virtuelle",
  WORKSHOP: "Atelier",
  DEFENSE: "Soutenance",
  MENTORING: "Mentorat",
  CONFERENCE: "Conférence",
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

const PROVIDER_LABEL: Record<EventProvider, string> = {
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
  TEAMS: "Microsoft Teams",
  JITSI: "Jitsi Meet",
  IN_PERSON: "Présentiel",
  OTHER: "En ligne",
};

function fmtDateTime(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: tz }).format(d);
  } catch {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: TZ }).format(d);
  }
}
function fmtTime(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(d);
  } catch {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(d);
  }
}

/** Échappe une charge JSON-LD pour un injection sûre dans un <script>. */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ev = await getEventBySlug(slug, null);
  if (!ev) return { title: "Événement introuvable" };
  const desc = ev.description?.slice(0, 160) ?? `${TYPE_LABEL[ev.type]} Access Academy`;
  const url = `${siteConfig.url}/evenements/${ev.slug}`;
  return {
    title: ev.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: ev.title,
      description: desc,
      url,
      type: "website",
      ...(ev.coverImage ? { images: [{ url: ev.coverImage }] } : {}),
    },
  };
}

/* ─── En-tête de section ──────────────────────────────────────────────────── */
function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-da text-white shadow-brand" aria-hidden>
          <Icon size={18} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await currentUser();
  const ev = await getEventBySlug(slug, user?.id ?? null);
  if (!ev) notFound();

  const Icon = TYPE_ICON[ev.type] ?? Video;
  const inPerson = ev.provider === "IN_PERSON";
  const providerLabel = inPerson ? ev.location ?? "Présentiel" : PROVIDER_LABEL[ev.provider] ?? "En ligne";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    ...(ev.description ? { description: ev.description.slice(0, 300) } : {}),
    startDate: ev.startAt.toISOString(),
    ...(ev.endAt ? { endDate: ev.endAt.toISOString() } : {}),
    eventAttendanceMode: inPerson
      ? "https://schema.org/OfflineEventAttendanceMode"
      : "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    ...(inPerson && ev.location
      ? { location: { "@type": "Place", name: ev.location } }
      : { location: { "@type": "VirtualLocation", url: `${siteConfig.url}/evenements/${ev.slug}` } }),
    organizer: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    ...(ev.speakerName ? { performer: { "@type": "Person", name: ev.speakerName } } : {}),
    ...(ev.coverImage ? { image: ev.coverImage } : {}),
  };

  return (
    <div className="pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* ══════════════════ Hero navy ══════════════════ */}
      <section className="relative overflow-hidden bg-navy text-white">
        <span className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-violet/30 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15]" aria-hidden />
        <Container className="relative py-10 sm:py-14">
          {/* Fil d'Ariane */}
          <nav aria-label="Fil d'Ariane" className="mb-6 flex items-center gap-1.5 text-xs text-white/60">
            <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-white">
              <Home size={13} aria-hidden />
              Accueil
            </Link>
            <ChevronRight size={13} aria-hidden />
            <Link href="/evenements" className="transition-colors hover:text-white">
              Événements
            </Link>
            <ChevronRight size={13} aria-hidden />
            <span className="truncate text-white/80">{ev.title}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <Badge variant="gradient">
                <Icon size={12} aria-hidden />
                {TYPE_LABEL[ev.type] ?? ev.type}
              </Badge>
              {ev.isPast && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                  Terminé
                </span>
              )}
              {ev.schoolName && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm">
                  <GraduationCap size={13} aria-hidden />
                  {ev.schoolName}
                </span>
              )}
              {ev.cohortName && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm">
                  {ev.cohortName}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {ev.title}
            </h1>

            {ev.speakerName && (
              <p className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-brand-cyan">
                <Mic2 size={16} aria-hidden />
                {ev.speakerName}
              </p>
            )}

            {/* Méta */}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock size={15} className="text-brand-cyan" aria-hidden />
                {fmtDateTime(ev.startAt, ev.timezone)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {inPerson ? <MapPin size={15} aria-hidden /> : <Video size={15} aria-hidden />}
                {providerLabel}
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* ══════════════════ Corps + colonne d'inscription ══════════════════ */}
      <Container className="relative">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          {/* ── Colonne d'inscription (sticky) ── */}
          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-[0_24px_60px_-30px_rgba(43,58,140,0.5)] lg:-mt-24">
                {/* Cover */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  {ev.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="relative h-full w-full"
                      style={{ background: "linear-gradient(125deg,#5b3fa8,#2b5cc6 45%,#1e8fe1 72%,#00bcd4)" }}
                      aria-hidden
                    >
                      <span className="absolute -right-6 -top-8 h-28 w-28 rounded-full border border-white/20" />
                      <span className="absolute inset-0 bg-grid opacity-30" />
                      <Icon size={48} className="absolute bottom-4 right-4 text-white/30" aria-hidden />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Méta clés */}
                  <dl className="mb-5 space-y-3 text-sm">
                    <div className="flex items-start gap-2.5">
                      <CalendarClock size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">Date et heure</dt>
                        <dd className="font-medium text-navy">{fmtDateTime(ev.startAt, ev.timezone)}</dd>
                        {ev.endAt && (
                          <dd className="text-xs text-text-secondary">Jusqu&apos;à {fmtTime(ev.endAt, ev.timezone)}</dd>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      {inPerson ? (
                        <MapPin size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                      ) : (
                        <Globe size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                      )}
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">Format</dt>
                        <dd className="font-medium text-navy">{providerLabel}</dd>
                      </div>
                    </div>
                    {ev.capacity != null && !ev.isPast && (
                      <div className="flex items-start gap-2.5">
                        <Users size={16} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">Places</dt>
                          <dd className="font-medium text-navy">
                            {ev.isFull
                              ? "Complet"
                              : `${ev.seatsLeft} place${(ev.seatsLeft ?? 0) > 1 ? "s" : ""} sur ${ev.capacity}`}
                          </dd>
                        </div>
                      </div>
                    )}
                  </dl>

                  {/* CTA */}
                  <EventRegisterButton
                    eventId={ev.id}
                    slug={ev.slug}
                    registered={ev.registered}
                    canRegister={ev.canRegister}
                    isPast={ev.isPast}
                    isFull={ev.isFull}
                    seatsLeft={ev.seatsLeft}
                    meetingUrl={ev.meetingUrl}
                    replayUrl={ev.replayUrl}
                    audience={ev.audience}
                    authenticated={!!user}
                    emailVerified={!!user?.emailVerified}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── Contenu principal ── */}
          <div className="order-2 space-y-12 py-10 lg:order-1 lg:py-12">
            {/* Description */}
            {ev.description && (
              <Block icon={Sparkles} title="À propos de cet événement">
                <Markdown className="prose-sm sm:prose-base">{ev.description}</Markdown>
              </Block>
            )}

            {/* Intervenant */}
            {(ev.speakerName || ev.hostName) && (
              <Block icon={Mic2} title="Intervenant">
                <div className="flex flex-wrap gap-4">
                  {ev.speakerName && (
                    <div className="flex items-center gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary p-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-da text-white shadow-brand" aria-hidden>
                        <Mic2 size={18} />
                      </span>
                      <div>
                        <p className="font-display text-sm font-bold text-navy">{ev.speakerName}</p>
                        <p className="text-xs text-text-secondary">Intervenant·e</p>
                      </div>
                    </div>
                  )}
                  {ev.hostName && ev.hostName !== ev.speakerName && (
                    <div className="flex items-center gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary p-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-white" aria-hidden>
                        <UserCheck size={18} />
                      </span>
                      <div>
                        <p className="font-display text-sm font-bold text-navy">{ev.hostName}</p>
                        <p className="text-xs text-text-secondary">Organisateur·rice</p>
                      </div>
                    </div>
                  )}
                </div>
              </Block>
            )}

            {/* Ressources (inscrits / passés) */}
            {ev.resources.length > 0 && (
              <Block icon={FileText} title="Ressources">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {ev.resources.map((r, i) => (
                    <li key={i}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-navy/[0.08] bg-surface-primary p-4 transition-all hover:border-brand-blue-vif/40 hover:shadow-[0_14px_30px_-18px_rgba(43,58,140,0.4)]"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-blue-vif/10 text-brand-blue-royal" aria-hidden>
                          <FileText size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-sm font-bold text-navy group-hover:text-brand-blue-royal">
                            {r.title}
                          </span>
                          {r.kind && <span className="block text-xs text-text-secondary">{r.kind}</span>}
                        </span>
                        <ExternalLink size={15} className="shrink-0 text-text-muted group-hover:text-brand-blue-royal" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {/* Replay */}
            {ev.replayUrl && (
              <Block icon={PlayCircle} title="Revoir l'événement">
                <div className="relative overflow-hidden rounded-2xl border border-brand-violet/20 bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] p-6">
                  <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-da opacity-10 blur-2xl" aria-hidden />
                  <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand" aria-hidden>
                        <PlayCircle size={24} />
                      </span>
                      <div>
                        <h3 className="font-display text-base font-bold text-navy">Replay disponible</h3>
                        <p className="mt-1 text-sm leading-relaxed text-navy/75">
                          Vous avez manqué la session en direct ? Rattrapez-la à votre rythme.
                        </p>
                      </div>
                    </div>
                    <a
                      href={ev.replayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
                    >
                      <PlayCircle size={16} aria-hidden />
                      Voir le replay
                    </a>
                  </div>
                </div>
              </Block>
            )}

            {/* Compte rendu (passé) */}
            {ev.summary && (
              <Block icon={ClipboardList} title="Compte rendu">
                <Markdown className="prose-sm sm:prose-base">{ev.summary}</Markdown>
              </Block>
            )}

            {/* Repli si aucune section de contenu */}
            {!ev.description && !ev.speakerName && !ev.hostName && ev.resources.length === 0 && !ev.replayUrl && !ev.summary && (
              <div className="flex items-start gap-3 rounded-xl border border-navy/[0.08] bg-surface-secondary/50 p-5 text-sm text-text-secondary">
                <CalendarClock size={18} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                <p>
                  Le programme détaillé de cet événement sera publié prochainement. Inscrivez-vous pour recevoir un
                  rappel et le lien de connexion.
                </p>
              </div>
            )}

            {/* Rappel format présentiel */}
            {inPerson && ev.location && (
              <div className="flex items-start gap-3 rounded-xl border border-navy/[0.08] bg-surface-primary p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet" aria-hidden>
                  <MapPin size={18} />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-navy">Lieu</p>
                  <p className="mt-0.5 text-sm text-navy/80">{ev.location}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-text-secondary">
                    <Clock size={12} aria-hidden />
                    Présentez-vous 10 minutes avant le début.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
