"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Circle,
  CircleDashed,
  CircleDot,
  Loader2,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  ListTodo,
  ReceiptText,
  FileText,
  ShieldCheck,
  X,
  Package,
} from "lucide-react";
import { cn, formatFCFA, formatDate } from "@da/ui";
import {
  INVOICE_STATUS,
  PROJECT_STATUS,
  StatusPill,
  toneColor,
  type Tone,
} from "@/components/admin/ui";
import {
  updateProjectStatus,
  addProjectStage,
  updateStageStatus,
  deleteStage,
  sendAdminProjectMessage,
} from "@/lib/admin-actions";
import type {
  AdminProjectDetail,
  AdminStage,
} from "@/lib/admin-queries";

const PROJECT_STATUS_ORDER = [
  "PENDING",
  "IN_PROGRESS",
  "REVIEW",
  "DELIVERED",
  "MAINTENANCE",
  "ARCHIVED",
] as const;

/* Cycle des statuts d'étape (clic → suivant). */
const STAGE_CYCLE: Record<AdminStage["status"], AdminStage["status"]> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: "PENDING",
};

const STAGE_META: Record<
  AdminStage["status"],
  { label: string; tone: Tone; icon: React.ReactNode }
> = {
  PENDING: { label: "En attente", tone: "slate", icon: <CircleDashed className="h-4 w-4" /> },
  IN_PROGRESS: { label: "En cours", tone: "blue", icon: <CircleDot className="h-4 w-4" /> },
  COMPLETED: { label: "Terminée", tone: "green", icon: <Check className="h-4 w-4" /> },
};

export function ProjectManager({ project }: { project: AdminProjectDetail }) {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Erreur globale d'action */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="lg:col-span-3 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Colonne principale : étapes + messagerie */}
      <div className="space-y-6 lg:col-span-2">
        <StagesPanel project={project} setError={setError} />
        <MessagesPanel project={project} setError={setError} />
      </div>

      {/* Colonne latérale : statut + factures */}
      <div className="space-y-6">
        <StatusPanel project={project} setError={setError} />
        <InvoicesPanel project={project} />
      </div>
    </div>
  );
}

/* ══════════════════════════════ Carte panneau ═════════════════════════════ */

function Panel({
  icon,
  title,
  action,
  children,
  bodyClassName,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
      <header className="flex items-center justify-between gap-3 border-b border-navy/[0.06] px-5 py-4">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-da text-white">
            {icon}
          </span>
          {title}
        </h2>
        {action}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ═══════════════════════════════ Statut ═══════════════════════════════════ */

function StatusPanel({
  project,
  setError,
}: {
  project: AdminProjectDetail;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const meta = PROJECT_STATUS[project.status]!;

  const change = (status: string) => {
    setOpen(false);
    if (status === project.status) return;
    setError(null);
    startTransition(async () => {
      const res = await updateProjectStatus({ id: project.id, status });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  return (
    <Panel icon={<ShieldCheck className="h-4 w-4" />} title="Statut du projet">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={pending}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-navy/[0.09] bg-surface-secondary/50 px-4 py-3 text-left transition-colors hover:border-navy/20 disabled:opacity-60"
        >
          <span className="flex items-center gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-violet" />
            ) : (
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: toneColor(meta.tone as Tone) }}
              />
            )}
            <span className="font-semibold text-navy">{meta.label}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-text-muted transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-navy/[0.09] bg-surface-primary shadow-xl"
            >
              <ul className="p-1.5">
                {PROJECT_STATUS_ORDER.map((s) => {
                  const m = PROJECT_STATUS[s]!;
                  const active = s === project.status;
                  return (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => change(s)}
                        disabled={active}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          active
                            ? "cursor-default bg-navy/[0.04] font-semibold text-navy"
                            : "text-text-secondary hover:bg-navy/[0.04] hover:text-navy",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: toneColor(m.tone as Tone) }}
                          />
                          {m.label}
                        </span>
                        {active && <Check className="h-4 w-4 text-success" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-text-muted">
        Le client voit ce statut dans son espace. Chaque changement est répercuté
        instantanément.
      </p>
    </Panel>
  );
}

/* ══════════════════════════════ Étapes ════════════════════════════════════ */

function StagesPanel({
  project,
  setError,
}: {
  project: AdminProjectDetail;
  setError: (e: string | null) => void;
}) {
  const [adding, setAdding] = React.useState(false);

  return (
    <Panel
      icon={<ListTodo className="h-4 w-4" />}
      title="Étapes du projet"
      action={
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-shadow hover:shadow-md"
        >
          {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {adding ? "Fermer" : "Ajouter"}
        </button>
      }
      bodyClassName="p-0"
    >
      {/* Formulaire d'ajout */}
      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-navy/[0.06] bg-surface-secondary/40"
          >
            <AddStageForm
              projectId={project.id}
              onDone={() => setAdding(false)}
              setError={setError}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {project.stages.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-navy/[0.04] text-text-muted">
            <ListTodo className="h-5 w-5" />
          </span>
          <p className="mt-3 font-display text-sm font-bold text-navy">
            Aucune étape définie
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-text-secondary">
            Structurez le projet en étapes livrables. Le client suivra
            l’avancement dans sa timeline.
          </p>
        </div>
      ) : (
        <ol className="relative px-5 py-5">
          {/* Rail vertical dégradé */}
          <span
            aria-hidden
            className="absolute left-[34px] top-8 bottom-8 w-0.5 rounded-full bg-gradient-to-b from-brand-violet via-brand-blue-vif to-brand-cyan opacity-40"
          />
          {project.stages.map((stage, idx) => (
            <StageRow
              key={stage.id}
              stage={stage}
              projectId={project.id}
              isLast={idx === project.stages.length - 1}
              setError={setError}
            />
          ))}
        </ol>
      )}
    </Panel>
  );
}

function AddStageForm({
  projectId,
  onDone,
  setError,
}: {
  projectId: string;
  onDone: () => void;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Le nom de l’étape doit contenir au moins 2 caractères.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await addProjectStage({
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (res.ok) {
        setName("");
        setDescription("");
        onDone();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 p-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-navy">
          Nom de l’étape
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Maquettes UI validées"
          maxLength={120}
          autoFocus
          className="w-full rounded-lg border border-navy/[0.12] bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-navy">
          Description <span className="font-normal text-text-muted">(optionnel)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Détails, livrables attendus…"
          rows={2}
          maxLength={2000}
          className="w-full resize-none rounded-lg border border-navy/[0.12] bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-navy/[0.04] hover:text-navy disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending || name.trim().length < 2}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-4 py-2 text-xs font-semibold text-white shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Ajouter l’étape
        </button>
      </div>
    </form>
  );
}

function StageRow({
  stage,
  projectId,
  isLast,
  setError,
}: {
  stage: AdminStage;
  projectId: string;
  isLast: boolean;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [deleting, startDelete] = React.useTransition();
  const [confirm, setConfirm] = React.useState(false);
  const meta = STAGE_META[stage.status];

  const cycle = () => {
    setError(null);
    const next = STAGE_CYCLE[stage.status];
    startTransition(async () => {
      const res = await updateStageStatus({ stageId: stage.id, projectId, status: next });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  const remove = () => {
    setError(null);
    startDelete(async () => {
      const res = await deleteStage({ stageId: stage.id, projectId });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  return (
    <li className={cn("relative flex gap-4", isLast ? "" : "pb-6")}>
      {/* Pastille de statut cliquable (fait avancer le cycle) */}
      <button
        type="button"
        onClick={cycle}
        disabled={pending}
        title={`Statut : ${meta.label} — cliquez pour passer à « ${STAGE_META[STAGE_CYCLE[stage.status]].label} »`}
        className={cn(
          "relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 bg-surface-primary transition-all",
          stage.status === "COMPLETED"
            ? "border-transparent bg-gradient-da text-white"
            : stage.status === "IN_PROGRESS"
              ? "border-brand-blue-royal text-brand-blue-royal"
              : "border-navy/15 text-text-muted hover:border-brand-violet/50",
          pending && "opacity-60",
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : meta.icon}
      </button>

      {/* Contenu de l'étape */}
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={cn(
                "font-display text-sm font-bold text-navy",
                stage.status === "COMPLETED" && "text-text-secondary",
              )}
            >
              {stage.name}
            </p>
            {stage.description && (
              <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                {stage.description}
              </p>
            )}
          </div>
          <StatusPill label={meta.label} tone={meta.tone} />
        </div>

        {/* Livrables */}
        {stage.deliverables.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {stage.deliverables.map((d, i) => (
              <li
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-medium text-text-secondary"
              >
                <Package className="h-3 w-3" />
                {d}
              </li>
            ))}
          </ul>
        )}

        {/* Ligne d'actions */}
        <div className="mt-2 flex items-center gap-3 text-[11px] text-text-muted">
          {stage.completedAt && (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-success" />
              Terminée le {formatDate(stage.completedAt)}
            </span>
          )}
          {confirm ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="font-medium text-error">Supprimer ?</span>
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="inline-flex items-center gap-1 rounded-md bg-error/10 px-2 py-0.5 font-semibold text-error transition-colors hover:bg-error/15 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Oui"}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                disabled={deleting}
                className="rounded-md px-2 py-0.5 font-semibold text-text-secondary transition-colors hover:bg-navy/[0.04]"
              >
                Non
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="inline-flex items-center gap-1 font-medium text-text-muted transition-colors hover:text-error"
            >
              <Trash2 className="h-3 w-3" />
              Supprimer
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/* ═════════════════════════════ Messagerie ═════════════════════════════════ */

function MessagesPanel({
  project,
  setError,
}: {
  project: AdminProjectDetail;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [content, setContent] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = content.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      const res = await sendAdminProjectMessage({ projectId: project.id, content: value });
      if (res.ok) {
        setContent("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Panel
      icon={<MessageSquare className="h-4 w-4" />}
      title="Messagerie projet"
      action={
        <span className="rounded-full bg-navy/[0.05] px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
          {project.messages.length} message{project.messages.length > 1 ? "s" : ""}
        </span>
      }
      bodyClassName="p-0"
    >
      {/* Fil de discussion */}
      <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-5 [scrollbar-width:thin]">
        {project.messages.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-text-secondary">
              Aucun message pour l’instant. Démarrez la conversation avec le
              client ci-dessous.
            </p>
          </div>
        ) : (
          project.messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", m.author.isTeam && "flex-row-reverse text-right")}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                  m.author.isTeam
                    ? "bg-gradient-da text-white"
                    : "bg-navy/[0.06] text-text-secondary",
                )}
              >
                {initials(m.author.name)}
              </span>
              <div className={cn("min-w-0 max-w-[80%]", m.author.isTeam && "items-end")}>
                <p className="text-[11px] font-medium text-text-muted">
                  {m.author.isTeam ? "Équipe Digital Access" : m.author.name}
                  <span className="mx-1.5">·</span>
                  {formatDate(m.createdAt)}
                </p>
                <div
                  className={cn(
                    "mt-1 inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                    m.author.isTeam
                      ? "bg-gradient-da text-white"
                      : "border border-navy/[0.07] bg-surface-secondary/60 text-navy",
                  )}
                >
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Zone de saisie */}
      <form
        onSubmit={submit}
        className="border-t border-navy/[0.06] bg-surface-secondary/40 p-4"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
            }}
            placeholder="Écrire un message au client…"
            rows={2}
            maxLength={4000}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-navy/[0.12] bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
          />
          <button
            type="submit"
            disabled={pending || !content.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-da text-white shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Envoyer le message"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-text-muted">
          Astuce : Ctrl/⌘ + Entrée pour envoyer.
        </p>
      </form>
    </Panel>
  );
}

/* ══════════════════════════════ Factures ══════════════════════════════════ */

function InvoicesPanel({ project }: { project: AdminProjectDetail }) {
  return (
    <Panel
      icon={<ReceiptText className="h-4 w-4" />}
      title="Factures"
      action={
        <Link
          href={`/admin/factures/nouvelle?projet=${project.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy/[0.12] bg-surface-primary px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-cyan/40 hover:text-brand-blue-royal"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvelle
        </Link>
      }
      bodyClassName="p-0"
    >
      {project.invoices.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-navy/[0.04] text-text-muted">
            <FileText className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-navy">Aucune facture</p>
          <p className="mx-auto mt-1 max-w-[220px] text-xs text-text-secondary">
            Générez une facture pour ce projet en un clic.
          </p>
          <Link
            href={`/admin/factures/nouvelle?projet=${project.id}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-shadow hover:shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            Créer une facture
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-navy/[0.06]">
          {project.invoices.map((inv) => {
            const meta = INVOICE_STATUS[inv.status]!;
            return (
              <li key={inv.id}>
                <Link
                  href={`/admin/factures/${inv.id}/edit`}
                  className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-secondary/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-navy group-hover:text-brand-blue-royal">
                      {inv.number}
                    </p>
                    {inv.dueDate && (
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        Échéance {formatDate(inv.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-display text-sm font-bold text-navy">
                      {formatFCFA(inv.total)}
                    </span>
                    <StatusPill label={meta.label} tone={meta.tone as Tone} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ─────────────────────────────── Utils ─────────────────────────────────── */

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
