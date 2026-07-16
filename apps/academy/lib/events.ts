import "server-only";
import {
  prisma,
  type Prisma,
  type EventType,
  type EventStatus,
  type EventAudience,
  type EventProvider,
  type EnrollmentStatus,
} from "@da/academy-db/client";
import { isAdmin } from "./guards";
import { ACQUIRED_STATUSES } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Événements & agenda — lectures seules (cahier §24 événements, §16.1 agenda).
   RÈGLE DE VISIBILITÉ (selon `audience`) :
     · PUBLIC   → visible par tout le monde ;
     · ENROLLED → réservé aux inscrits de la formation/du parcours lié ;
     · COHORT   → réservé aux membres ACTIVE de la cohorte liée.
   INVARIANT DE SÉCURITÉ : le `meetingUrl` (lien de connexion) n'est JAMAIS
   exposé à un non-inscrit / non-membre. Il n'apparaît dans le retour que si
   l'utilisateur est inscrit à l'événement OU membre de la cohorte OU l'hôte OU
   administrateur. Le compte rendu et les ressources ne sont dévoilés qu'une fois
   l'événement passé OU à un inscrit.
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

/* ─── Types exposés ────────────────────────────────────────────────────────── */

export interface EventResource {
  title: string;
  url: string;
  kind: string | null;
}

/** Carte d'événement publique — SANS `meetingUrl`. */
export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: EventType;
  startAt: Date;
  endAt: Date | null;
  provider: EventProvider;
  location: string | null;
  coverImage: string | null;
  speakerName: string | null;
  /** Replay : uniquement pour les événements passés. */
  replayUrl: string | null;
  registrationsCount: number;
  capacity: number | null;
  cohortName: string | null;
  schoolName: string | null;
}

export interface EventDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: EventType;
  audience: EventAudience;
  startAt: Date;
  endAt: Date | null;
  timezone: string;
  provider: EventProvider;
  location: string | null;
  coverImage: string | null;
  speakerName: string | null;
  hostName: string | null;
  cohortName: string | null;
  schoolName: string | null;
  replayUrl: string | null;
  /** Lien de connexion — non-null UNIQUEMENT si inscrit / membre / hôte / admin. */
  meetingUrl: string | null;
  /** Compte rendu — affiché si l'événement est passé OU si l'utilisateur est inscrit. */
  summary: string | null;
  /** Ressources — affichées si l'événement est passé OU si l'utilisateur est inscrit. */
  resources: EventResource[];
  registrationsCount: number;
  capacity: number | null;
  registered: boolean;
  seatsTaken: number;
  seatsLeft: number | null;
  isFull: boolean;
  isPast: boolean;
  canRegister: boolean;
}

export interface MyEvent {
  id: string;
  slug: string;
  title: string;
  type: EventType;
  startAt: Date;
  endAt: Date | null;
  provider: EventProvider;
  location: string | null;
  coverImage: string | null;
  /** Visible : l'utilisateur est inscrit à cet événement. */
  meetingUrl: string | null;
  status: EventStatus;
  /** Présence effective (pertinent pour les événements passés). */
  attended: boolean;
}

export interface AgendaItem {
  id: string;
  slug: string;
  title: string;
  type: EventType;
  startAt: Date;
  endAt: Date | null;
  /** "SESSION" = session de cohorte ; "EVENT" = événement auquel l'utilisateur est inscrit. */
  source: "EVENT" | "SESSION";
  cohortName: string | null;
  /** Visible : l'utilisateur est inscrit OU membre de la cohorte. */
  meetingUrl: string | null;
}

/* ─── Helpers internes ─────────────────────────────────────────────────────── */

/** Parse défensivement le JSON `resources` : ne garde que les liens http(s) valides. */
function parseResources(value: Prisma.JsonValue | null | undefined): EventResource[] {
  if (!Array.isArray(value)) return [];
  const out: EventResource[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;
    const title = typeof rec.title === "string" ? rec.title : null;
    const url = typeof rec.url === "string" ? rec.url : null;
    if (!title || !url || !/^https?:\/\//i.test(url)) continue; // bloque javascript:/data:
    out.push({ title, url, kind: typeof rec.kind === "string" ? rec.kind : null });
  }
  return out;
}

/** Inscription « acquise » (ACTIVE/COMPLETED) à la formation OU au parcours lié. */
async function hasContextEnrollment(
  userId: string,
  courseId: string | null,
  careerPathId: string | null,
): Promise<boolean> {
  if (courseId) {
    const e = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });
    if (e && ACQUIRED.includes(e.status)) return true;
  }
  if (careerPathId) {
    const pe = await prisma.careerPathEnrollment.findUnique({
      where: { userId_careerPathId: { userId, careerPathId } },
      select: { status: true },
    });
    if (pe && ACQUIRED.includes(pe.status)) return true;
  }
  return false;
}

/** Membre ACTIVE de la cohorte. */
async function isActiveCohortMember(userId: string, cohortId: string | null): Promise<boolean> {
  if (!cohortId) return false;
  const m = await prisma.cohortMember.findUnique({
    where: { cohortId_userId: { cohortId, userId } },
    select: { status: true },
  });
  return !!m && m.status === "ACTIVE";
}

/* ─── Sélections réutilisables ─────────────────────────────────────────────── */

const publicEventSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  type: true,
  startAt: true,
  endAt: true,
  provider: true,
  location: true,
  coverImage: true,
  speakerName: true,
  replayUrl: true,
  capacity: true,
  cohort: { select: { name: true } },
  school: { select: { name: true } },
  _count: { select: { registrations: true } },
} satisfies Prisma.EventSelect;

type PublicEventRow = Prisma.EventGetPayload<{ select: typeof publicEventSelect }>;

function toPublicEvent(e: PublicEventRow, isPast: boolean): PublicEvent {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description,
    type: e.type,
    startAt: e.startAt,
    endAt: e.endAt,
    provider: e.provider,
    location: e.location,
    coverImage: e.coverImage,
    speakerName: e.speakerName,
    replayUrl: isPast ? e.replayUrl : null,
    registrationsCount: e._count.registrations,
    capacity: e.capacity,
    cohortName: e.cohort?.name ?? null,
    schoolName: e.school?.name ?? null,
  };
}

const eventDetailSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  type: true,
  audience: true,
  startAt: true,
  endAt: true,
  timezone: true,
  provider: true,
  location: true,
  coverImage: true,
  speakerName: true,
  meetingUrl: true,
  replayUrl: true,
  summary: true,
  resources: true,
  capacity: true,
  status: true,
  hostId: true,
  courseId: true,
  careerPathId: true,
  cohortId: true,
  host: { select: { name: true } },
  cohort: { select: { name: true } },
  school: { select: { name: true } },
  _count: { select: { registrations: true } },
} satisfies Prisma.EventSelect;

/* ─── Événements publics (§24) ─────────────────────────────────────────────── */

export async function getPublicEvents(
  filters: { type?: EventType } = {},
): Promise<{ upcoming: PublicEvent[]; past: PublicEvent[] }> {
  const now = new Date();
  const base: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    audience: "PUBLIC",
    ...(filters.type ? { type: filters.type } : {}),
  };

  const [upcomingRows, pastRows] = await Promise.all([
    prisma.event.findMany({
      where: { ...base, startAt: { gte: now } },
      select: publicEventSelect,
      orderBy: { startAt: "asc" },
      take: 50,
    }),
    prisma.event.findMany({
      where: { ...base, startAt: { lt: now } },
      select: publicEventSelect,
      orderBy: { startAt: "desc" },
      take: 12,
    }),
  ]);

  return {
    upcoming: upcomingRows.map((e) => toPublicEvent(e, false)),
    past: pastRows.map((e) => toPublicEvent(e, true)),
  };
}

/* ─── Fiche événement (§24.2) ──────────────────────────────────────────────── */

export async function getEventBySlug(slug: string, userId?: string | null): Promise<EventDetail | null> {
  const event = await prisma.event.findUnique({ where: { slug }, select: eventDetailSelect });
  if (!event || event.status !== "PUBLISHED") return null;

  const now = new Date();
  const isPast = event.startAt.getTime() < now.getTime();

  let registered = false;
  let cohortMember = false;
  let enrolledCtx = false;
  let admin = false;
  const isHost = !!userId && !!event.hostId && event.hostId === userId;

  if (userId) {
    const [reg, member, roles] = await Promise.all([
      prisma.eventRegistration.findUnique({
        where: { eventId_userId: { eventId: event.id, userId } },
        select: { id: true },
      }),
      isActiveCohortMember(userId, event.cohortId),
      prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }),
    ]);
    registered = !!reg;
    cohortMember = member;
    admin = isAdmin(roles);
    if (event.audience === "ENROLLED") {
      enrolledCtx = await hasContextEnrollment(userId, event.courseId, event.careerPathId);
    }
  }

  const privileged = registered || cohortMember || isHost || admin;
  // L'audience autorise-t-elle CET utilisateur à s'inscrire / à voir ?
  const audienceAllows =
    event.audience === "PUBLIC" ||
    (event.audience === "ENROLLED" && enrolledCtx) ||
    (event.audience === "COHORT" && cohortMember);

  // Verrou de visibilité : sinon l'événement est invisible (null).
  if (!audienceAllows && !privileged) return null;

  const seatsTaken = event._count.registrations;
  const isFull = event.capacity != null && seatsTaken >= event.capacity;
  const seatsLeft = event.capacity != null ? Math.max(0, event.capacity - seatsTaken) : null;

  const showMeetingUrl = registered || cohortMember || isHost || admin;
  const showDetails = isPast || registered;

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    type: event.type,
    audience: event.audience,
    startAt: event.startAt,
    endAt: event.endAt,
    timezone: event.timezone,
    provider: event.provider,
    location: event.location,
    coverImage: event.coverImage,
    speakerName: event.speakerName,
    hostName: event.host?.name ?? null,
    cohortName: event.cohort?.name ?? null,
    schoolName: event.school?.name ?? null,
    replayUrl: event.replayUrl,
    meetingUrl: showMeetingUrl ? event.meetingUrl : null,
    summary: showDetails ? event.summary : null,
    resources: showDetails ? parseResources(event.resources) : [],
    registrationsCount: seatsTaken,
    capacity: event.capacity,
    registered,
    seatsTaken,
    seatsLeft,
    isFull,
    isPast,
    canRegister: !isPast && !isFull && !registered && audienceAllows,
  };
}

/* ─── Mes événements (§24, espace apprenant) ───────────────────────────────── */

const myEventSelect = {
  id: true,
  slug: true,
  title: true,
  type: true,
  startAt: true,
  endAt: true,
  provider: true,
  location: true,
  coverImage: true,
  meetingUrl: true,
  status: true,
} satisfies Prisma.EventSelect;

export async function getMyEvents(userId: string): Promise<{ upcoming: MyEvent[]; past: MyEvent[] }> {
  const now = new Date();
  const regs = await prisma.eventRegistration.findMany({
    where: { userId, event: { status: { not: "DRAFT" } } },
    orderBy: { event: { startAt: "asc" } },
    take: 200,
    select: { attended: true, event: { select: myEventSelect } },
  });

  const upcoming: MyEvent[] = [];
  const past: MyEvent[] = [];
  for (const r of regs) {
    // Inscrit ⇒ le lien de connexion est légitimement exposé.
    const item: MyEvent = { ...r.event, attended: r.attended };
    if (r.event.startAt.getTime() >= now.getTime()) upcoming.push(item);
    else past.push(item);
  }
  past.reverse(); // passés du plus récent au plus ancien
  return { upcoming, past };
}

/* ─── Agenda à venir (§16.1) ───────────────────────────────────────────────── */

/**
 * Fusion dédupliquée (par event.id) des événements auxquels l'utilisateur est
 * inscrit ET des sessions des cohortes dont il est membre ACTIVE, à venir. Le
 * `OR` Prisma déduplique naturellement par identité de ligne.
 */
export async function getUpcomingAgenda(userId: string, opts?: { take?: number }): Promise<AgendaItem[]> {
  const now = new Date();
  const take = opts?.take ?? 6;

  const memberships = await prisma.cohortMember.findMany({
    where: { userId, status: "ACTIVE" },
    select: { cohortId: true },
  });
  const cohortIds = memberships.map((m) => m.cohortId);

  const or: Prisma.EventWhereInput[] = [{ registrations: { some: { userId } } }];
  if (cohortIds.length > 0) or.push({ cohortId: { in: cohortIds } });

  const rows = await prisma.event.findMany({
    where: { status: "PUBLISHED", startAt: { gte: now }, OR: or },
    orderBy: { startAt: "asc" },
    take,
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      startAt: true,
      endAt: true,
      meetingUrl: true,
      cohortId: true,
      cohort: { select: { name: true } },
    },
  });

  return rows.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    type: e.type,
    startAt: e.startAt,
    endAt: e.endAt,
    source: e.cohortId ? "SESSION" : "EVENT",
    cohortName: e.cohort?.name ?? null,
    meetingUrl: e.meetingUrl, // inscrit OU membre de la cohorte : lien légitime
  }));
}
