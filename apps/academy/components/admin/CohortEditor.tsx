"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Info,
  CalendarRange,
  Users,
  UserCog,
  CalendarDays,
  Megaphone,
  Search,
  UserPlus,
  BookOpen,
  Route,
  GraduationCap,
  Pin,
  ExternalLink,
  Plus,
  Loader2,
} from "lucide-react";
import { cn, Avatar } from "@da/ui";
import type { getCohortAdmin } from "@/lib/cohort-admin-queries";
import { formatFCFA } from "@/lib/site";
import { ImageUpload } from "@/components/ImageUpload";
import { Select } from "@/components/Select";
import {
  updateCohort,
  setCohortStatus,
  deleteCohort,
  addCohortInstructor,
  removeCohortInstructor,
  addCohortMemberAdmin,
  removeCohortMember,
} from "@/lib/cohort-admin-actions";
import { postCohortAnnouncement, deleteAnnouncement } from "@/lib/announcement-actions";
import { StatusPill, type PillTone } from "./ui";
import { inputClass, textareaClass, FieldLabel } from "./forms";
import { useAdminAction, Feedback, SaveButton, DeleteButton } from "./action-hooks";

/* ══════════════════════════════════════════════════════════════════════════
   Éditeur de cohorte (§23). Onglets : fiche, planning & cible, membres,
   encadrants, sessions (lecture seule), annonces. Chaque mutation passe par
   une Server Action gardée admin. La recherche d'utilisateurs est une Server
   Action passée en prop depuis la page (les requêtes sont server-only).
   ══════════════════════════════════════════════════════════════════════════ */

type CohortAdmin = NonNullable<Awaited<ReturnType<typeof getCohortAdmin>>>;
type Targets = {
  courses: { id: string; title: string; slug: string }[];
  paths: { id: string; title: string; slug: string }[];
  schools: { id: string; name: string }[];
};
type SearchUser = { id: string; name: string; email: string; roles: string[] };
type SearchUsersFn = (q: string) => Promise<SearchUser[]>;

type Tab = "fiche" | "planning" | "membres" | "encadrants" | "sessions" | "annonces";

const COHORT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  OPEN: "Inscriptions ouvertes",
  RUNNING: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};
const COHORT_STATUS_TONE: Record<string, PillTone> = {
  DRAFT: "neutral",
  OPEN: "success",
  RUNNING: "info",
  COMPLETED: "violet",
  CANCELLED: "danger",
};
const COHORT_TYPE_LABEL: Record<string, string> = {
  AUTONOMOUS: "Autonome",
  GUIDED: "Accompagnée",
  INTENSIVE: "Intensive",
  ENTERPRISE: "Entreprise",
  HYBRID: "Hybride",
  VIRTUAL_CLASS: "Classe virtuelle",
};
const MEMBER_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  COMPLETED: "Terminé",
  WITHDRAWN: "Retiré",
};
const MEMBER_STATUS_TONE: Record<string, PillTone> = {
  PENDING: "warning",
  ACTIVE: "success",
  COMPLETED: "violet",
  WITHDRAWN: "neutral",
};

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

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
function formatDate(d: Date | string | null | undefined): string {
  return d ? dateFmt.format(new Date(d)) : "—";
}
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

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "fiche", label: "Fiche", icon: Info },
  { id: "planning", label: "Planning & cible", icon: CalendarRange },
  { id: "membres", label: "Membres", icon: Users },
  { id: "encadrants", label: "Encadrants", icon: UserCog },
  { id: "sessions", label: "Sessions", icon: CalendarDays },
  { id: "annonces", label: "Annonces", icon: Megaphone },
];

export function CohortEditor({
  cohort,
  targets,
  searchUsers,
}: {
  cohort: CohortAdmin;
  targets: Targets;
  searchUsers: SearchUsersFn;
}) {
  const [tab, setTab] = React.useState<Tab>("fiche");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/cohortes"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
        >
          ← Toutes les cohortes
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-sm" aria-hidden>
              <Users size={20} />
            </span>
            <div className="min-w-0">
              <h1 className="min-w-0 truncate font-display text-2xl font-extrabold tracking-tight text-navy sm:text-[1.7rem]">
                {cohort.name}
              </h1>
              {cohort.code && <p className="truncate font-mono text-xs text-text-muted">{cohort.code}</p>}
            </div>
          </div>
          <StatusPill
            label={COHORT_STATUS_LABEL[cohort.status] ?? cohort.status}
            tone={COHORT_STATUS_TONE[cohort.status] ?? "neutral"}
            className="shrink-0"
          />
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
              {active && <motion.span layoutId="cohort-tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-da" />}
            </button>
          );
        })}
      </div>

      {tab === "fiche" && <FicheTab cohort={cohort} />}
      {tab === "planning" && <PlanningTab cohort={cohort} targets={targets} />}
      {tab === "membres" && <MembresTab cohort={cohort} searchUsers={searchUsers} />}
      {tab === "encadrants" && <EncadrantsTab cohort={cohort} searchUsers={searchUsers} />}
      {tab === "sessions" && <SessionsTab cohort={cohort} />}
      {tab === "annonces" && <AnnoncesTab cohort={cohort} />}
    </div>
  );
}

/* ─── Onglet Fiche ─────────────────────────────────────────────────────────── */

function FicheTab({ cohort }: { cohort: CohortAdmin }) {
  const { pending, msg, run } = useAdminAction();
  const [name, setName] = React.useState(cohort.name);
  const [description, setDescription] = React.useState(cohort.description ?? "");
  const [rules, setRules] = React.useState(cohort.rules ?? "");
  const [rhythm, setRhythm] = React.useState(cohort.rhythm ?? "");
  const [type, setType] = React.useState(cohort.type as string);
  const [cover, setCover] = React.useState<string | null>(cohort.coverImage ?? null);

  function save() {
    run(() =>
      updateCohort(cohort.id, {
        name,
        description,
        rules,
        rhythm,
        type: type as never,
        coverImage: cover ?? "",
      }),
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Identité de la cohorte</h2>
          <div className="space-y-4">
            <FieldLabel label="Nom" required>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </FieldLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldLabel label="Type d'accompagnement">
                <Select
                  value={type}
                  onChange={setType}
                  ariaLabel="Type de cohorte"
                  options={Object.entries(COHORT_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
                />
              </FieldLabel>
              <FieldLabel label="Rythme" hint="Ex. 2 soirs/semaine, temps plein…">
                <input value={rhythm} onChange={(e) => setRhythm(e.target.value)} className={inputClass} placeholder="Ex. 2 soirs / semaine" />
              </FieldLabel>
            </div>
            <FieldLabel label="Description" hint="Markdown accepté.">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(textareaClass, "min-h-[130px]")} />
            </FieldLabel>
            <FieldLabel label="Règles / engagement" hint="Assiduité, prérequis, conditions… (markdown).">
              <textarea value={rules} onChange={(e) => setRules(e.target.value)} className={cn(textareaClass, "min-h-[110px]")} />
            </FieldLabel>
          </div>
        </div>

        <DangerZone cohort={cohort} />
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Couverture</h2>
          <ImageUpload value={cover} onChange={setCover} folder="cohorts" aspect="16 / 9" />
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

function DangerZone({ cohort }: { cohort: CohortAdmin }) {
  const router = useRouter();
  const { pending, run } = useAdminAction();
  return (
    <div className="rounded-2xl border border-error/20 bg-error/[0.03] p-5">
      <h2 className="font-display text-base font-bold text-navy">Zone de danger</h2>
      <p className="mt-1 text-sm text-text-secondary">
        La suppression retire la cohorte, ses membres, encadrants, sessions et annonces. Les inscriptions pédagogiques sous-jacentes sont conservées.
      </p>
      <div className="mt-4">
        <DeleteButton
          pending={pending}
          label="Supprimer la cohorte"
          onConfirm={() => run(() => deleteCohort(cohort.id), { onOk: () => router.push("/admin/cohortes") })}
        />
      </div>
    </div>
  );
}

/* ─── Onglet Planning & cible ──────────────────────────────────────────────── */

function PlanningTab({ cohort, targets }: { cohort: CohortAdmin; targets: Targets }) {
  const { pending, msg, run } = useAdminAction();
  const [courseId, setCourseId] = React.useState<string | null>(cohort.courseId ?? null);
  const [pathId, setPathId] = React.useState<string | null>(cohort.careerPathId ?? null);
  const [schoolId, setSchoolId] = React.useState<string | null>(cohort.schoolId ?? null);
  const [startDate, setStartDate] = React.useState(toLocalInput(cohort.startDate));
  const [endDate, setEndDate] = React.useState(toLocalInput(cohort.endDate));
  const [deadline, setDeadline] = React.useState(toLocalInput(cohort.enrollmentDeadline));
  const [capacity, setCapacity] = React.useState(cohort.capacity != null ? String(cohort.capacity) : "");
  const [price, setPrice] = React.useState(cohort.price != null ? String(cohort.price) : "");
  const [status, setStatusState] = React.useState(cohort.status as string);

  function pickCourse(id: string) {
    setCourseId(id || null);
    if (id) setPathId(null);
  }
  function pickPath(id: string) {
    setPathId(id || null);
    if (id) setCourseId(null);
  }

  function save() {
    run(() =>
      updateCohort(cohort.id, {
        courseId,
        careerPathId: pathId,
        schoolId,
        startDate: fromLocalInput(startDate) as never,
        endDate: fromLocalInput(endDate) as never,
        enrollmentDeadline: fromLocalInput(deadline) as never,
        capacity: capacity === "" ? null : Number(capacity),
        price: price === "" ? null : Number(price),
      }),
    );
  }

  function changeStatus(next: string) {
    setStatusState(next);
    run(() => setCohortStatus(cohort.id, next as never));
  }

  const priceNum = Number(price);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Cible pédagogique */}
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <h2 className="mb-1 font-display text-base font-bold text-navy">Cible pédagogique</h2>
        <p className="mb-4 text-sm text-text-secondary">
          Choisissez <strong>une formation OU un parcours</strong> — sélectionner l'un efface l'autre.
        </p>
        <div className="space-y-4">
          <FieldLabel label="Formation">
            <Select
              value={courseId}
              onChange={pickCourse}
              ariaLabel="Formation cible"
              placeholder="Aucune formation"
              options={[
                { value: "", label: "— Aucune —" },
                ...targets.courses.map((c) => ({ value: c.id, label: c.title, icon: <BookOpen size={14} className="text-brand-blue-royal" /> })),
              ]}
            />
          </FieldLabel>
          <FieldLabel label="Parcours métier">
            <Select
              value={pathId}
              onChange={pickPath}
              ariaLabel="Parcours cible"
              placeholder="Aucun parcours"
              options={[
                { value: "", label: "— Aucun —" },
                ...targets.paths.map((p) => ({ value: p.id, label: p.title, icon: <Route size={14} className="text-brand-violet" /> })),
              ]}
            />
          </FieldLabel>
          <FieldLabel label="École de rattachement">
            <Select
              value={schoolId}
              onChange={(v) => setSchoolId(v || null)}
              ariaLabel="École"
              placeholder="Aucune école"
              options={[
                { value: "", label: "— Aucune —" },
                ...targets.schools.map((s) => ({ value: s.id, label: s.name, icon: <GraduationCap size={14} className="text-brand-blue-royal" /> })),
              ]}
            />
          </FieldLabel>
        </div>
      </div>

      {/* Calendrier & capacité */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Calendrier</h2>
          <div className="space-y-4">
            <FieldLabel label="Date de début" required>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Date de fin">
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </FieldLabel>
            <FieldLabel label="Clôture des inscriptions">
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
            </FieldLabel>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Capacité & tarif</h2>
          <div className="grid grid-cols-2 gap-4">
            <FieldLabel label="Places (capacité)" hint="Vide = illimité.">
              <input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputClass} placeholder="Illimité" />
            </FieldLabel>
            <FieldLabel label="Prix (FCFA)" hint={price !== "" && !Number.isNaN(priceNum) ? formatFCFA(priceNum) : "Vide = gratuit."}>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="0" />
            </FieldLabel>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-1 font-display text-base font-bold text-navy">Statut de la cohorte</h2>
          <p className="mb-4 text-sm text-text-secondary">Le changement de statut est appliqué immédiatement.</p>
          <Select
            value={status}
            onChange={changeStatus}
            disabled={pending}
            ariaLabel="Statut de la cohorte"
            options={Object.entries(COHORT_STATUS_LABEL).map(([value, label]) => ({ value, label }))}
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

/* ─── Recherche d'utilisateurs (réutilisée membres / encadrants) ───────────── */

function UserSearch({
  searchUsers,
  onPick,
  disabled,
  excludeIds,
  placeholder = "Rechercher par nom ou email…",
}: {
  searchUsers: SearchUsersFn;
  onPick: (userId: string) => void;
  disabled?: boolean;
  excludeIds: string[];
  placeholder?: string;
}) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<SearchUser[]>([]);
  const [searching, startSearch] = React.useTransition();
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setTouched(false);
      return;
    }
    const t = window.setTimeout(() => {
      startSearch(async () => {
        const res = await searchUsers(term);
        setResults(res);
        setTouched(true);
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [q, searchUsers]);

  const filtered = results.filter((r) => !excludeIds.includes(r.id));

  function pick(userId: string) {
    onPick(userId);
    setQ("");
    setResults([]);
    setTouched(false);
  }

  return (
    <div>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
        {searching && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-blue-royal" aria-hidden />}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className={cn(inputClass, "pl-9")}
          disabled={disabled}
        />
      </div>
      {q.trim().length >= 2 && (
        <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-navy/[0.08] p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-text-muted">
              {touched && !searching ? "Aucun utilisateur trouvé." : "Recherche…"}
            </p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={disabled}
                onClick={() => pick(u.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-brand-blue-vif/[0.06] disabled:opacity-50"
              >
                <Avatar name={u.name} className="h-8 w-8 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy">{u.name}</span>
                  <span className="block truncate text-xs text-text-muted">{u.email}</span>
                </span>
                <UserPlus size={15} className="shrink-0 text-brand-blue-royal" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Onglet Membres ───────────────────────────────────────────────────────── */

function MembresTab({ cohort, searchUsers }: { cohort: CohortAdmin; searchUsers: SearchUsersFn }) {
  const { pending, msg, run } = useAdminAction();
  const excludeIds = cohort.members.map((m) => m.user.id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
              <Users size={17} className="text-brand-blue-royal" /> Membres
              <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-semibold text-text-secondary">{cohort.members.length}</span>
            </h2>
            <Feedback msg={msg} />
          </div>
          {cohort.members.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">Aucun membre pour le moment. Ajoutez des apprenants depuis le panneau de droite.</p>
          ) : (
            <ul className="space-y-2">
              {cohort.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-navy/[0.07] p-3">
                  <Avatar name={m.user.name} src={m.user.avatar ?? undefined} className="h-9 w-9 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{m.user.name}</p>
                    <p className="truncate text-xs text-text-muted">{m.user.email}</p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-text-muted sm:block">Rejoint le {formatDate(m.joinedAt)}</span>
                  <StatusPill
                    label={MEMBER_STATUS_LABEL[m.status] ?? m.status}
                    tone={MEMBER_STATUS_TONE[m.status] ?? "neutral"}
                    className="shrink-0"
                  />
                  <DeleteButton compact pending={pending} label="Retirer" onConfirm={() => run(() => removeCohortMember(m.id))} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-navy">
            <UserPlus size={17} className="text-brand-violet" /> Ajouter un membre
          </h2>
          <p className="mb-4 text-sm text-text-secondary">L'ajout inscrit aussi l'apprenant à la formation ou au parcours cible.</p>
          <UserSearch
            searchUsers={searchUsers}
            excludeIds={excludeIds}
            disabled={pending}
            onPick={(userId) => run(() => addCohortMemberAdmin(cohort.id, userId))}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Onglet Encadrants ────────────────────────────────────────────────────── */

function EncadrantsTab({ cohort, searchUsers }: { cohort: CohortAdmin; searchUsers: SearchUsersFn }) {
  const { pending, msg, run } = useAdminAction();
  const [roleLabel, setRoleLabel] = React.useState("");
  const excludeIds = cohort.instructors.map((i) => i.user.id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
            <UserCog size={17} className="text-brand-blue-royal" /> Encadrants
            <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-semibold text-text-secondary">{cohort.instructors.length}</span>
          </h2>
          <Feedback msg={msg} />
        </div>
        {cohort.instructors.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Aucun encadrant assigné. Ajoutez formateurs et mentors depuis le panneau de droite.</p>
        ) : (
          <ul className="space-y-2">
            {cohort.instructors.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-xl border border-navy/[0.07] p-3">
                <Avatar name={i.user.name} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{i.user.name}</p>
                  <p className="truncate text-xs text-text-muted">{i.user.email}</p>
                </div>
                {i.roleLabel && (
                  <span className="hidden shrink-0 rounded-full bg-brand-violet/10 px-2.5 py-0.5 text-xs font-semibold text-brand-violet sm:inline-flex">
                    {i.roleLabel}
                  </span>
                )}
                <DeleteButton compact pending={pending} label="Retirer" onConfirm={() => run(() => removeCohortInstructor(i.id))} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-navy">
          <UserPlus size={17} className="text-brand-violet" /> Ajouter un encadrant
        </h2>
        <p className="mb-4 text-sm text-text-secondary">Formateurs, mentors ou administrateurs.</p>
        <FieldLabel label="Rôle (facultatif)" hint="Ex. Formateur principal, Mentor, Tuteur." className="mb-3">
          <input value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} className={inputClass} placeholder="Ex. Formateur principal" />
        </FieldLabel>
        <UserSearch
          searchUsers={searchUsers}
          excludeIds={excludeIds}
          disabled={pending}
          onPick={(userId) => run(() => addCohortInstructor(cohort.id, userId, roleLabel.trim() || undefined))}
        />
      </div>
    </div>
  );
}

/* ─── Onglet Sessions (lecture seule) ──────────────────────────────────────── */

function SessionsTab({ cohort }: { cohort: CohortAdmin }) {
  return (
    <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
            <CalendarDays size={17} className="text-brand-blue-royal" /> Sessions de la cohorte
          </h2>
          <p className="mt-1 text-sm text-text-secondary">Les sessions sont des événements rattachés à cette cohorte. Créez-les et gérez-les dans Événements.</p>
        </div>
        <Link
          href="/admin/evenements"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.02]"
        >
          <Plus size={16} /> Créer une session
        </Link>
      </div>

      {cohort.events.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">Aucune session planifiée pour cette cohorte.</p>
      ) : (
        <ul className="divide-y divide-navy/[0.05]">
          {cohort.events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-blue-vif/10 text-brand-blue-royal" aria-hidden>
                <CalendarDays size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">{e.title}</p>
                <p className="truncate text-xs text-text-muted">
                  {formatDateTime(e.startAt)} · {EVENT_TYPE_LABEL[e.type] ?? e.type}
                </p>
              </div>
              <StatusPill label={EVENT_STATUS_LABEL[e.status] ?? e.status} tone={EVENT_STATUS_TONE[e.status] ?? "neutral"} className="shrink-0" />
              <Link
                href={`/admin/evenements/${e.id}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
              >
                Gérer <ExternalLink size={12} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Onglet Annonces ──────────────────────────────────────────────────────── */

function AnnoncesTab({ cohort }: { cohort: CohortAdmin }) {
  const { pending, msg, run } = useAdminAction();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [pinned, setPinned] = React.useState(false);

  function publish() {
    run(
      () => postCohortAnnouncement(cohort.id, { title, body, pinned }),
      {
        onOk: () => {
          setTitle("");
          setBody("");
          setPinned(false);
        },
      },
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-navy">
          <Megaphone size={17} className="text-brand-blue-royal" /> Annonces publiées
          <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-semibold text-text-secondary">{cohort.announcements.length}</span>
        </h2>
        {cohort.announcements.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Aucune annonce publiée sur cette cohorte.</p>
        ) : (
          <ul className="space-y-2">
            {cohort.announcements.map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-xl border border-navy/[0.07] p-3">
                {a.pinned && <Pin size={15} className="mt-0.5 shrink-0 text-accent" aria-label="Épinglée" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{a.title}</p>
                  <p className="truncate text-xs text-text-muted">{formatDateTime(a.createdAt)}</p>
                </div>
                <DeleteButton compact pending={pending} label="Supprimer" onConfirm={() => run(() => deleteAnnouncement(a.id))} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <h2 className="mb-4 font-display text-base font-bold text-navy">Nouvelle annonce</h2>
        <div className="space-y-4">
          <FieldLabel label="Titre" required>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Ex. Report de la session de mardi" />
          </FieldLabel>
          <FieldLabel label="Message" hint="Markdown accepté." required>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className={cn(textareaClass, "min-h-[140px]")} />
          </FieldLabel>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 text-brand-blue-royal accent-brand-blue-royal"
            />
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-navy">
              <Pin size={14} className="text-accent" /> Épingler en haut
            </span>
          </label>
          <div className="flex items-center justify-end gap-3">
            <Feedback msg={msg} />
            <SaveButton pending={pending} onClick={publish}>
              Publier l'annonce
            </SaveButton>
          </div>
        </div>
      </div>
    </div>
  );
}
