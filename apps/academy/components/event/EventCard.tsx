"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Video,
  MonitorPlay,
  Wrench,
  GraduationCap,
  UserCheck,
  Presentation,
  HelpCircle,
  MapPin,
  Users,
  CalendarClock,
  PlayCircle,
  ArrowRight,
} from "lucide-react";
import { cn, Badge } from "@da/ui";
import type { EventType, EventProvider } from "@da/academy-db/client";
import type { PublicEvent } from "@/lib/events";

/* ══════════════════════════════════════════════════════════════════════════
   Carte d'événement Access Academy (cahier §24) — présentation brandée,
   entièrement cliquable, hover élévation DA, prête pour un rendu en cascade
   (variants hidden/show, direct child d'un StaggerGroup). Pastille de date
   signature sur la couverture. Fuseau fixe (Abidjan) pour un rendu déterministe.
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
  TEAMS: "Teams",
  JITSI: "Jitsi",
  IN_PERSON: "Présentiel",
  OTHER: "En ligne",
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const hoverProps = {
  whileHover: { y: -6, scale: 1.02, boxShadow: "0 22px 48px -12px rgba(43,58,140,0.28)" },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 300, damping: 22 },
} as const;

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(d);
}
function formatWeekday(d: Date): string {
  const s = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: TZ }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function dayNumber(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: TZ }).format(d);
}
function monthShort(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: TZ }).format(d).replace(".", "");
}

export function EventCard({
  event,
  past = false,
  className,
}: {
  event: PublicEvent;
  /** Événement passé : bandeau replay, opacité de la couverture. */
  past?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const Icon = TYPE_ICON[event.type] ?? Video;
  const inPerson = event.provider === "IN_PERSON";
  const seatsLeft = event.capacity != null ? Math.max(0, event.capacity - event.registrationsCount) : null;
  const isFull = event.capacity != null && seatsLeft === 0;

  return (
    <motion.article
      variants={cardVariants}
      {...(reduce ? {} : hoverProps)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary",
        className,
      )}
    >
      <Link href={`/evenements/${event.slug}`} className="absolute inset-0 z-10" aria-label={`Événement : ${event.title}`} />

      {/* ── Couverture ── */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {event.coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImage}
              alt=""
              loading="lazy"
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
                past && "opacity-70",
              )}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/10 to-transparent" aria-hidden />
          </>
        ) : (
          <div
            className={cn("relative h-full w-full", past && "opacity-90")}
            style={{ background: "linear-gradient(125deg,#5b3fa8 0%,#2b5cc6 40%,#1e8fe1 72%,#00bcd4 100%)" }}
            aria-hidden
          >
            <span className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/20" />
            <span className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/[0.07]" />
            <span className="absolute inset-0 bg-grid opacity-30" />
            <Icon size={44} className="absolute bottom-4 right-4 text-white/25" aria-hidden />
          </div>
        )}

        {/* Pastille de date signature */}
        <span className="absolute left-3 top-3 z-[1] grid h-14 w-14 place-items-center rounded-xl bg-white/95 text-center shadow-[0_8px_20px_-8px_rgba(43,58,140,0.55)] backdrop-blur-sm">
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold text-navy">{dayNumber(event.startAt)}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-blue-royal">
              {monthShort(event.startAt)}
            </span>
          </span>
        </span>

        {/* Badges */}
        <div className="absolute right-3 top-3 z-[1] flex flex-col items-end gap-1.5">
          <Badge variant="gradient">
            <Icon size={12} aria-hidden />
            {TYPE_LABEL[event.type] ?? event.type}
          </Badge>
          {past && event.replayUrl && (
            <Badge className="bg-white/90 text-navy backdrop-blur-sm">
              <PlayCircle size={12} className="text-brand-violet" aria-hidden />
              Replay
            </Badge>
          )}
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="flex flex-1 flex-col p-5">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue-royal">
          <CalendarClock size={13} aria-hidden />
          {formatWeekday(event.startAt)} · {formatTime(event.startAt)}
        </p>

        <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug text-navy transition-colors group-hover:text-brand-blue-royal">
          {event.title}
        </h3>

        {event.speakerName && (
          <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
            Avec <span className="font-semibold text-navy/80">{event.speakerName}</span>
          </p>
        )}

        {(event.schoolName || event.cohortName) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {event.schoolName && <Badge variant="soft">{event.schoolName}</Badge>}
            {event.cohortName && <Badge variant="outline">{event.cohortName}</Badge>}
          </div>
        )}

        {/* Méta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1">
            {inPerson ? <MapPin size={13} aria-hidden /> : <Video size={13} aria-hidden />}
            {inPerson ? event.location ?? "Présentiel" : PROVIDER_LABEL[event.provider] ?? "En ligne"}
          </span>
          {seatsLeft != null && !past && (
            <span className={cn("inline-flex items-center gap-1", isFull ? "font-semibold text-error" : "")}>
              <Users size={13} aria-hidden />
              {isFull ? "Complet" : `${seatsLeft} place${seatsLeft > 1 ? "s" : ""}`}
            </span>
          )}
          {event.registrationsCount > 0 && (past || seatsLeft == null) && (
            <span className="inline-flex items-center gap-1">
              <Users size={13} aria-hidden />
              {event.registrationsCount} inscrit{event.registrationsCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Pied */}
        <div className="mt-auto flex items-center justify-between border-t border-navy/[0.06] pt-4">
          <span className="text-sm font-semibold text-navy">
            {past ? "Voir le compte rendu" : "Voir l'événement"}
          </span>
          <span
            className="grid h-8 w-8 place-items-center rounded-full bg-navy/[0.05] text-navy transition-all duration-300 group-hover:bg-gradient-da group-hover:text-white"
            aria-hidden
          >
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}
