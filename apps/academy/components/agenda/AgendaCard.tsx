"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Video,
  MonitorPlay,
  Wrench,
  Presentation,
  MessagesSquare,
  Mic,
  MessageCircleQuestion,
  CalendarClock,
  UsersRound,
  Radio,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@da/ui";
import type { EventType } from "@da/academy-db/client";
import { unregisterFromEvent } from "@/lib/event-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Carte d'agenda (cahier §16.1 / §24) — rendu client d'un rendez-vous, qu'il
   provienne d'un événement autonome (source EVENT) ou d'une session de cohorte
   (source SESSION). Seuls les événements autonomes À VENIR proposent la
   désinscription ; les sessions de cohorte ne se quittent pas depuis l'agenda.
   Le lien « Rejoindre » n'apparaît que si le serveur a exposé un meetingUrl.
   ══════════════════════════════════════════════════════════════════════════ */

export interface AgendaCardItem {
  id: string;
  slug: string;
  title: string;
  type: EventType;
  startAt: Date | string;
  endAt: Date | string | null;
  source: "EVENT" | "SESSION";
  cohortName: string | null;
  meetingUrl: string | null;
  /** Rendez-vous déjà passé — affiche la présence au lieu de « Rejoindre ». */
  past?: boolean;
  /** Présence effective (rendez-vous passés). */
  attended?: boolean;
}

const TYPE_ICON: Record<EventType, LucideIcon> = {
  WEBINAR: Radio,
  VIRTUAL_CLASS: MonitorPlay,
  WORKSHOP: Wrench,
  DEFENSE: Presentation,
  MENTORING: MessagesSquare,
  CONFERENCE: Mic,
  QA_SESSION: MessageCircleQuestion,
};

const TYPE_LABEL: Record<EventType, string> = {
  WEBINAR: "Webinaire",
  VIRTUAL_CLASS: "Classe virtuelle",
  WORKSHOP: "Atelier",
  DEFENSE: "Soutenance",
  MENTORING: "Mentorat",
  CONFERENCE: "Conférence",
  QA_SESSION: "Questions-réponses",
};

const timeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" });
const clockFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
function formatDateTime(value: Date | string): string {
  return timeFmt.format(toDate(value));
}
function formatClock(value: Date | string): string {
  return clockFmt.format(toDate(value));
}

export function AgendaCard({ item }: { item: AgendaCardItem }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  const Icon = TYPE_ICON[item.type] ?? CalendarClock;
  const isEvent = item.source === "EVENT";
  const canUnregister = isEvent && !item.past;
  const showJoin = !item.past && !!item.meetingUrl;

  function unregister() {
    setError("");
    startTransition(async () => {
      const res = await unregisterFromEvent(item.id);
      if (res.ok) {
        router.refresh();
      } else if (res.redirect) {
        router.push(res.redirect);
      } else {
        setError(res.error ?? "La désinscription a échoué. Réessayez.");
      }
    });
  }

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "group relative flex gap-4 overflow-hidden rounded-2xl border bg-surface-primary p-4 transition-shadow sm:p-5",
        item.past ? "border-navy/[0.07]" : "border-navy/[0.07] hover:shadow-lg",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", item.past ? "bg-navy/10" : "bg-gradient-da")}
        aria-hidden
      />

      <span
        className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
          item.past
            ? "bg-navy/[0.05] text-text-muted"
            : "bg-gradient-to-br from-brand-violet/12 to-brand-cyan/12 text-brand-violet",
        )}
        aria-hidden
      >
        <Icon size={22} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy/70">
            {TYPE_LABEL[item.type] ?? item.type}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              isEvent ? "bg-brand-blue-vif/[0.1] text-brand-blue-royal" : "bg-accent/[0.1] text-accent",
            )}
          >
            {isEvent ? <CalendarClock size={11} aria-hidden /> : <UsersRound size={11} aria-hidden />}
            {isEvent ? "Événement" : "Session de cohorte"}
          </span>
        </div>

        <h3 className="mt-2 font-display text-base font-bold leading-snug text-navy">{item.title}</h3>

        {item.cohortName && (
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <UsersRound size={12} aria-hidden />
            {item.cohortName}
          </p>
        )}

        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-navy">
          <Clock size={14} className="text-brand-blue-vif" aria-hidden />
          {formatDateTime(item.startAt)}
          {item.endAt && <span className="text-text-muted">→ {formatClock(item.endAt)}</span>}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {showJoin && (
            <a
              href={item.meetingUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-3.5 py-2 text-xs font-semibold text-white shadow-brand transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Video size={14} aria-hidden />
              Rejoindre
            </a>
          )}

          {!item.past && (
            <Link
              href={`/evenements/${item.slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/[0.04]"
            >
              Détails
            </Link>
          )}

          {item.past && (
            <>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  item.attended ? "bg-success/10 text-success" : "bg-navy/[0.06] text-text-muted",
                )}
              >
                {item.attended ? <CheckCircle2 size={12} aria-hidden /> : <XCircle size={12} aria-hidden />}
                {item.attended ? "Présent(e)" : "Absent(e)"}
              </span>
              <Link
                href={`/evenements/${item.slug}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/[0.04]"
              >
                <ExternalLink size={13} aria-hidden />
                Revoir
              </Link>
            </>
          )}

          {canUnregister && (
            <button
              type="button"
              onClick={unregister}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-error/[0.06] hover:text-error disabled:opacity-60"
            >
              {pending && <Loader2 size={13} className="animate-spin" aria-hidden />}
              Se désinscrire
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-xs font-medium text-error">{error}</p>}
      </div>
    </motion.article>
  );
}

export default AgendaCard;
