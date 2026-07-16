"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Info,
  CalendarClock,
  Paperclip,
  UserCheck,
  Eye,
  Plus,
  Trash2,
  Check,
  Video,
  Link2,
  GraduationCap,
  UsersRound,
  BookOpen,
  Route,
  User,
} from "lucide-react";
import { cn, Avatar } from "@da/ui";
import type { getEventAdmin } from "@/lib/event-admin-queries";
import { ImageUpload } from "@/components/ImageUpload";
import { Select } from "@/components/Select";
import { updateEvent, setEventStatus, deleteEvent, markAttendance } from "@/lib/event-admin-actions";
import { StatusPill, type PillTone } from "./ui";
import { inputClass, textareaClass, FieldLabel } from "./forms";
import { useAdminAction, Feedback, SaveButton, DeleteButton } from "./action-hooks";

/* ══════════════════════════════════════════════════════════════════════════
   Éditeur d'événement / classe virtuelle (§24). Onglets : fiche, planning &
   lien, ressources & replay, présence. Chaque mutation passe par une Server
   Action gardée admin. Les liens (visio, replay, ressources) sont validés
   http(s) côté serveur.
   ══════════════════════════════════════════════════════════════════════════ */

type EventAdmin = NonNullable<Awaited<ReturnType<typeof getEventAdmin>>>;
type Context = {
  cohorts: { id: string; name: string }[];
  courses: { id: string; title: string }[];
  paths: { id: string; title: string }[];
  schools: { id: string; name: string }[];
  hosts: { id: string; name: string }[];
};
type ResourceRow = { title: string; url: string; kind: string };
type Tab = "fiche" | "planning" | "ressources" | "presence";

const EVENT_STATUS_LABEL: Record<string, string> = { DRAFT: "Brouillon", PUBLISHED: "Publié", CANCELLED: "Annulé" };
const EVENT_STATUS_TONE: Record<string, PillTone> = { DRAFT: "neutral", PUBLISHED: "success", CANCELLED: "danger" };
const EVENT_TYPE_LABEL: Record<string, string> = {
  WEBINAR: "Webinaire",
  VIRTUAL_CLASS: "Classe virtuelle",
  WORKSHOP: "Atelier",
  DEFENSE: "Soutenance",
  MENTORING: "Mentorat",
  CONFERENCE: "Conférence",
  QA_SESSION: "Questions-réponses",
};
const EVENT_AUDIENCE_LABEL: Record<string, string> = { PUBLIC: "Public", ENROLLED: "Inscrits", COHORT: "Cohorte" };
const EVENT_PROVIDER_LABEL: Record<string, string> = {
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
  TEAMS: "Teams",
  JITSI: "Jitsi",
  IN_PERSON: "Présentiel",
  OTHER: "Autre",
};

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
function formatDateTime(d: Date | string | null | undefined): string {
  return d ? dateTimeFmt.format(new Date(d)) : "—";
}
function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function fromLocalInput(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function parseResources(v: unknown): ResourceRow[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    return [{ title: String(o.title ?? ""), url: String(o.url ?? ""), kind: o.kind ? String(o.kind) : "" }];
  });
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "fiche", label: "Fiche", icon: Info },
  { id: "planning", label: "Planning & lien", icon: CalendarClock },
  { id: "ressources", label: "Ressources & replay", icon: Paperclip },
  { id: "presence", label: "Présence", icon: UserCheck },
];

export function EventEditor({ event, context }: { event: EventAdmin; context: Context }) {
  const [tab, setTab] = React.useState<Tab>("fiche");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/evenements"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
        >
          ← Tous les événements
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-sm" aria-hidden>
              <Video size={20} />
            </span>
            <div className="min-w-0">
              <h1 className="min-w-0 truncate font-display text-2xl font-extrabold tracking-tight text-navy sm:text-[1.7rem]">{event.title}</h1>
              <p className="truncate text-xs text-text-muted">{EVENT_TYPE_LABEL[event.type] ?? event.type}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusPill label={EVENT_STATUS_LABEL[event.status] ?? event.status} tone={EVENT_STATUS_TONE[event.status] ?? "neutral"} />
            <Link
              href={`/evenements/${event.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
            >
              <Eye size={15} /> Aperçu public
            </Link>
          </div>
        </div>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-navy/[0.08] px-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                active ? "text-brand-blue-royal" : "text-text-secondary hover:text-navy",
              )}
            >
              <Icon size={16} />
              {t.label}
              {active && <motion.span layoutId="event-tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-da" />}
            </button>
          );
        })}
      </div>

      {tab === "fiche" && <FicheTab event={event} context={context} />}
      {tab === "planning" && <PlanningTab event={event} context={context} />}
      {tab === "ressources" && <RessourcesTab event={event} />}
      {tab === "presence" && <PresenceTab event={event} />}
    </div>
  );
}

/* ─── Onglet Fiche ─────────────────────────────────────────────────────────── */

function FicheTab({ event, context }: { event: EventAdmin; context: Context }) {
  const { pending, msg, run } = useAdminAction();
  const [title, setTitle] = React.useState(event.title);
  const [description, setDescription] = React.useState(event.description ?? "");
  const [type, setType] = React.useState(event.type as string);
  const [audience, setAudience] = React.useState(event.audience as string);
  const [speakerName, setSpeakerName] = React.useState(event.speakerName ?? "");
  const [hostId, setHostId] = React.useState<string | null>(event.hostId ?? null);
  const [cover, setCover] = React.useState<string | null>(event.coverImage ?? null);

  function save() {
    run(() =>
      updateEvent(event.id, {
        title,
        description,
        type: type as never,
        audience: audience as never,
        speakerName,
        hostId,
        coverImage: cover ?? "",
      }),
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Informations</h2>
          <div className="space-y-4">
            <FieldLabel label="Titre" required>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </FieldLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldLabel label="Type">
                <Select
                  value={type}
                  onChange={setType}
                  ariaLabel="Type d'événement"
                  options={Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
                />
              </FieldLabel>
              <FieldLabel label="Audience">
                <Select
                  value={audience}
                  onChange={setAudience}
                  ariaLabel="Audience"
                  options={Object.entries(EVENT_AUDIENCE_LABEL).map(([value, label]) => ({ value, label }))}
                />
              </FieldLabel>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldLabel label="Intervenant" hint="Nom affiché de l'animateur.">
                <input value={speakerName} onChange={(e) => setSpeakerName(e.target.value)} className={inputClass} placeholder="Ex. Awa Traoré" />
              </FieldLabel>
              <FieldLabel label="Animateur (compte)">
                <Select
                  value={hostId}
                  onChange={(v) => setHostId(v || null)}
                  ariaLabel="Animateur"
                  placeholder="Aucun"
                  options={[
                    { value: "", label: "— Aucun —" },
                    ...context.hosts.map((h) => ({ value: h.id, label: h.name, icon: <User size={14} className="text-brand-blue-royal" /> })),
                  ]}
                />
              </FieldLabel>
            </div>
            <FieldLabel label="Description" hint="Markdown accepté.">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(textareaClass, "min-h-[150px]")} />
            </FieldLabel>
          </div>
        </div>

        <DangerZone event={event} />
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Couverture</h2>
          <ImageUpload value={cover} onChange={setCover} folder="events" aspect="16 / 9" />
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary/95 px-4 py-3 shadow-lg backdrop-blur">
          <Feedback msg={msg} />
          <SaveButton pending={pending} onClick={save}>
            Enregistrer la fiche
          </SaveButton>
        </div>
      </div>
    </div>
  );
}

function DangerZone({ event }: { event: EventAdmin }) {
  const router = useRouter();
  const { pending, run } = useAdminAction();
  return (
    <div className="rounded-2xl border border-error/20 bg-error/[0.03] p-5">
      <h2 className="font-display text-base font-bold text-navy">Zone de danger</h2>
      <p className="mt-1 text-sm text-text-secondary">La suppression retire l'événement et toutes ses inscriptions. Cette action est définitive.</p>
      <div className="mt-4">
        <DeleteButton
          pending={pending}
          label="Supprimer l'événement"
          onConfirm={() => run(() => deleteEvent(event.id), { onOk: () => router.push("/admin/evenements") })}
        />
      </div>
    </div>
  );
}

/* ─── Onglet Planning & lien ───────────────────────────────────────────────── */

function PlanningTab({ event, context }: { event: EventAdmin; context: Context }) {
  const { pending, msg, run } = useAdminAction();
  const [startAt, setStartAt] = React.useState(toLocalInput(event.startAt));
  const [endAt, setEndAt] = React.useState(toLocalInput(event.endAt));
  const [timezone, setTimezone] = React.useState(event.timezone ?? "Africa/Abidjan");
  const [provider, setProvider] = React.useState(event.provider as string);
  const [meetingUrl, setMeetingUrl] = React.useState(event.meetingUrl ?? "");
  const [location, setLocation] = React.useState(event.location ?? "");
  const [capacity, setCapacity] = React.useState(event.capacity != null ? String(event.capacity) : "");
  const [cohortId, setCohortId] = React.useState<string | null>(event.cohortId ?? null);
  const [courseId, setCourseId] = React.useState<string | null>(event.courseId ?? null);
  const [pathId, setPathId] = React.useState<string | null>(event.careerPathId ?? null);
  const [schoolId, setSchoolId] = React.useState<string | null>(event.schoolId ?? null);
  const [status, setStatusState] = React.useState(event.status as string);

  function save() {
    const upd: Parameters<typeof updateEvent>[1] = {
      timezone,
      provider: provider as never,
      meetingUrl,
      location,
      capacity: capacity === "" ? null : Number(capacity),
      endAt: fromLocalInput(endAt) as never,
      cohortId,
      courseId,
      careerPathId: pathId,
      schoolId,
    };
    const startIso = fromLocalInput(startAt);
    if (startIso) upd.startAt = startIso as never;
    run(() => updateEvent(event.id, upd));
  }

  function changeStatus(next: string) {
    setStatusState(next);
    run(() => setEventStatus(event.id, next as never));
  }

  const isInPerson = provider === "IN_PERSON";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Calendrier & lien */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Calendrier</h2>
          <div className="space-y-4">
            <FieldLabel label="Début" required>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Fin">
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Fuseau horaire" hint="Ex. Africa/Abidjan">
              <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass} />
            </FieldLabel>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-navy">
            <Link2 size={17} className="text-brand-blue-royal" /> Accès
          </h2>
          <div className="space-y-4">
            <FieldLabel label="Fournisseur">
              <Select
                value={provider}
                onChange={setProvider}
                ariaLabel="Fournisseur de visio"
                options={Object.entries(EVENT_PROVIDER_LABEL).map(([value, label]) => ({ value, label }))}
              />
            </FieldLabel>
            {isInPerson ? (
              <FieldLabel label="Lieu" hint="Adresse ou salle du présentiel.">
                <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Ex. Campus DA, Cocody" />
              </FieldLabel>
            ) : (
              <FieldLabel label="Lien de la visio" hint="URL http(s) — partagée aux inscrits.">
                <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} className={inputClass} placeholder="https://meet.google.com/…" />
              </FieldLabel>
            )}
            <FieldLabel label="Capacité" hint="Vide = illimité.">
              <input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={cn(inputClass, "max-w-[160px]")} placeholder="Illimité" />
            </FieldLabel>
          </div>
        </div>
      </div>

      {/* Rattachements & statut */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-1 font-display text-base font-bold text-navy">Rattachements</h2>
          <p className="mb-4 text-sm text-text-secondary">Reliez l'événement à une cohorte, une formation, un parcours ou une école (facultatif).</p>
          <div className="space-y-4">
            <FieldLabel label="Cohorte">
              <Select
                value={cohortId}
                onChange={(v) => setCohortId(v || null)}
                ariaLabel="Cohorte"
                placeholder="Aucune"
                options={[
                  { value: "", label: "— Aucune —" },
                  ...context.cohorts.map((c) => ({ value: c.id, label: c.name, icon: <UsersRound size={14} className="text-brand-violet" /> })),
                ]}
              />
            </FieldLabel>
            <FieldLabel label="Formation">
              <Select
                value={courseId}
                onChange={(v) => setCourseId(v || null)}
                ariaLabel="Formation"
                placeholder="Aucune"
                options={[
                  { value: "", label: "— Aucune —" },
                  ...context.courses.map((c) => ({ value: c.id, label: c.title, icon: <BookOpen size={14} className="text-brand-blue-royal" /> })),
                ]}
              />
            </FieldLabel>
            <FieldLabel label="Parcours métier">
              <Select
                value={pathId}
                onChange={(v) => setPathId(v || null)}
                ariaLabel="Parcours"
                placeholder="Aucun"
                options={[
                  { value: "", label: "— Aucun —" },
                  ...context.paths.map((p) => ({ value: p.id, label: p.title, icon: <Route size={14} className="text-brand-violet" /> })),
                ]}
              />
            </FieldLabel>
            <FieldLabel label="École">
              <Select
                value={schoolId}
                onChange={(v) => setSchoolId(v || null)}
                ariaLabel="École"
                placeholder="Aucune"
                options={[
                  { value: "", label: "— Aucune —" },
                  ...context.schools.map((s) => ({ value: s.id, label: s.name, icon: <GraduationCap size={14} className="text-brand-blue-royal" /> })),
                ]}
              />
            </FieldLabel>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-1 font-display text-base font-bold text-navy">Statut de publication</h2>
          <p className="mb-4 text-sm text-text-secondary">Le changement de statut est appliqué immédiatement.</p>
          <Select
            value={status}
            onChange={changeStatus}
            disabled={pending}
            ariaLabel="Statut de l'événement"
            options={Object.entries(EVENT_STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary/95 px-4 py-3 shadow-lg backdrop-blur">
          <Feedback msg={msg} />
          <SaveButton pending={pending} onClick={save}>
            Enregistrer le planning
          </SaveButton>
        </div>
      </div>
    </div>
  );
}

/* ─── Onglet Ressources & replay ───────────────────────────────────────────── */

function RessourcesTab({ event }: { event: EventAdmin }) {
  const { pending, msg, run } = useAdminAction();
  const [replayUrl, setReplayUrl] = React.useState(event.replayUrl ?? "");
  const [summary, setSummary] = React.useState(event.summary ?? "");
  const [rows, setRows] = React.useState<ResourceRow[]>(() => parseResources(event.resources));

  function addRow() {
    setRows((r) => [...r, { title: "", url: "", kind: "" }]);
  }
  function updateRow(index: number, patch: Partial<ResourceRow>) {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeRow(index: number) {
    setRows((r) => r.filter((_, i) => i !== index));
  }

  function save() {
    const cleaned = rows
      .map((r) => ({ title: r.title.trim(), url: r.url.trim(), kind: r.kind.trim() }))
      .filter((r) => r.title && r.url)
      .map((r) => (r.kind ? { title: r.title, url: r.url, kind: r.kind } : { title: r.title, url: r.url }));
    run(() => updateEvent(event.id, { replayUrl, summary, resources: cleaned }));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <h2 className="mb-4 font-display text-base font-bold text-navy">Replay & compte-rendu</h2>
        <div className="space-y-4">
          <FieldLabel label="Lien du replay" hint="URL http(s) de l'enregistrement.">
            <input value={replayUrl} onChange={(e) => setReplayUrl(e.target.value)} className={inputClass} placeholder="https://youtu.be/…" />
          </FieldLabel>
          <FieldLabel label="Compte-rendu / résumé" hint="Markdown accepté.">
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className={cn(textareaClass, "min-h-[160px]")} />
          </FieldLabel>
        </div>
      </div>

      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
            <Paperclip size={17} className="text-brand-blue-royal" /> Ressources
          </h2>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Aucune ressource. Ajoutez des documents, slides ou liens utiles.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, i) => (
              <li key={i} className="rounded-xl border border-navy/[0.08] p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      value={row.title}
                      onChange={(e) => updateRow(i, { title: e.target.value })}
                      placeholder="Intitulé (ex. Slides de la session)"
                      className={inputClass}
                    />
                    <input
                      value={row.url}
                      onChange={(e) => updateRow(i, { url: e.target.value })}
                      placeholder="https://…"
                      className={inputClass}
                    />
                    <input
                      value={row.kind}
                      onChange={(e) => updateRow(i, { kind: e.target.value })}
                      placeholder="Type (facultatif : PDF, slides, lien…)"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Retirer la ressource"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-navy/10 text-text-muted transition-colors hover:border-error/40 hover:text-error"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-text-muted">Les lignes sans intitulé ou sans lien valide sont ignorées à l'enregistrement.</p>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary/95 px-4 py-3 shadow-lg backdrop-blur">
          <Feedback msg={msg} />
          <SaveButton pending={pending} onClick={save}>
            Enregistrer les ressources
          </SaveButton>
        </div>
      </div>
    </div>
  );
}

/* ─── Onglet Présence ──────────────────────────────────────────────────────── */

function PresenceTab({ event }: { event: EventAdmin }) {
  const { pending, msg, run } = useAdminAction();
  const presentCount = event.registrations.filter((r) => r.attended).length;

  return (
    <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
          <UserCheck size={17} className="text-brand-blue-royal" /> Émargement
          <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-semibold text-text-secondary">
            {presentCount} / {event.registrations.length} présent{presentCount > 1 ? "s" : ""}
          </span>
        </h2>
        <Feedback msg={msg} />
      </div>

      {event.registrations.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">Aucune inscription pour le moment.</p>
      ) : (
        <ul className="space-y-2">
          {event.registrations.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border border-navy/[0.07] p-3">
              <Avatar name={r.user.name} className="h-9 w-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">{r.user.name}</p>
                <p className="truncate text-xs text-text-muted">{r.user.email}</p>
              </div>
              <span className="hidden shrink-0 text-xs text-text-muted sm:block">Inscrit le {formatDateTime(r.registeredAt)}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => markAttendance(r.id, !r.attended))}
                aria-pressed={r.attended}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                  r.attended
                    ? "bg-success/12 text-success"
                    : "border border-navy/10 text-text-secondary hover:border-success/40 hover:text-success",
                )}
              >
                <Check size={13} className={r.attended ? "" : "opacity-40"} />
                {r.attended ? "Présent" : "Marquer présent"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
