"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  UserRound,
  StickyNote,
  Rocket,
  Trash2,
  Loader2,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { cn, buttonClasses, Field, Input, Textarea } from "@da/ui";
import { LEAD_STATUS, toneColor, type Tone } from "@/components/admin/ui";
import {
  updateLeadStatus,
  assignLead,
  updateLeadNotes,
  convertLeadToProject,
  deleteLead,
} from "@/lib/admin-actions";
import type { LeadDetail } from "@/lib/admin-queries";

const STATUSES = ["NEW", "CONTACTED", "QUOTE_SENT", "NEGOTIATION", "WON", "LOST"] as const;

export function LeadDetailPanel({
  lead,
  admins,
}: {
  lead: LeadDetail;
  admins: { id: string; name: string }[];
}) {
  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
      <StatusCard lead={lead} />
      <AssignCard lead={lead} admins={admins} />
      <NotesCard lead={lead} />
      <ConversionCard lead={lead} />
      <DangerCard lead={lead} />
    </aside>
  );
}

/* Feedback inline réutilisable. */
function Feedback({ error, saved }: { error: string | null; saved: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {error ? (
        <motion.p
          key="err"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-2 text-xs font-medium text-error"
        >
          {error}
        </motion.p>
      ) : saved ? (
        <motion.p
          key="ok"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-success"
        >
          <Check className="h-3.5 w-3.5" /> Enregistré
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

function CardShell({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
      <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-white">
          {icon}
        </span>
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ─────────────────────────────── Statut ────────────────────────────────── */

function StatusCard({ lead }: { lead: LeadDetail }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const change = (status: string) => {
    if (status === lead.status) return;
    setError(null);
    startTransition(async () => {
      const res = await updateLeadStatus({ id: lead.id, status });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  return (
    <CardShell title="Statut du lead" icon={<Check className="h-4 w-4" />}>
      <div className="grid grid-cols-2 gap-2">
        {STATUSES.map((s) => {
          const meta = LEAD_STATUS[s]!;
          const active = s === lead.status;
          const accent = toneColor(meta.tone as Tone);
          return (
            <button
              key={s}
              type="button"
              onClick={() => change(s)}
              disabled={pending}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all disabled:opacity-50",
                active
                  ? "border-transparent text-white shadow-sm"
                  : "border-navy/[0.08] bg-surface-primary text-navy hover:border-navy/20",
              )}
              style={active ? { background: accent } : undefined}
            >
              {!active && (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
              )}
              {active && <Check className="h-3.5 w-3.5 shrink-0" />}
              {meta.label}
            </button>
          );
        })}
      </div>
      <Feedback error={error} saved={false} />
    </CardShell>
  );
}

/* ────────────────────────────── Assignation ────────────────────────────── */

function AssignCard({
  lead,
  admins,
}: {
  lead: LeadDetail;
  admins: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const current = lead.assignee?.id ?? "";

  const assign = (value: string) => {
    setError(null);
    startTransition(async () => {
      const res = await assignLead({ id: lead.id, assigneeId: value || null });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  return (
    <CardShell title="Responsable" icon={<UserRound className="h-4 w-4" />}>
      <div className="relative">
        <select
          aria-label="Responsable du lead"
          value={current}
          disabled={pending}
          onChange={(e) => assign(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-lg border border-navy/[0.12] bg-surface-primary px-3 py-2.5 text-sm font-medium text-navy",
            "focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25 disabled:opacity-50",
          )}
        >
          <option value="">Non assigné</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {pending && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-blue-royal" />
        )}
      </div>
      <Feedback error={error} saved={false} />
    </CardShell>
  );
}

/* ──────────────────────────────── Notes ────────────────────────────────── */

function NotesCard({ lead }: { lead: LeadDetail }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [value, setValue] = React.useState(lead.notes ?? "");

  const dirty = value !== (lead.notes ?? "");

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateLeadNotes({ id: lead.id, notes: value });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <CardShell title="Notes internes" icon={<StickyNote className="h-4 w-4" />}>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder="Suivi d'appel, contexte, prochaines étapes…"
        className="resize-y"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-text-muted">Visible par l’équipe uniquement.</span>
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className={cn(buttonClasses({ variant: "primary", size: "sm" }), "disabled:opacity-50")}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
        </button>
      </div>
      <Feedback error={error} saved={saved} />
    </CardShell>
  );
}

/* ─────────────────────────── Conversion projet ─────────────────────────── */

function ConversionCard({ lead }: { lead: LeadDetail }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState(
    lead.company ? `Projet ${lead.company}` : `Projet ${lead.name}`,
  );
  const [budget, setBudget] = React.useState("");

  // Déjà converti → lien vers le projet.
  if (lead.convertedProjectId) {
    return (
      <CardShell title="Projet lié" icon={<Rocket className="h-4 w-4" />}>
        <p className="text-sm text-text-secondary">
          Ce lead a été converti en projet client.
        </p>
        <Link
          href={`/admin/projets/${lead.convertedProjectId}`}
          className={cn(buttonClasses({ variant: "outline", size: "sm" }), "mt-3 w-full")}
        >
          Ouvrir le projet
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardShell>
    );
  }

  const convert = () => {
    setError(null);
    const parsedBudget = budget.trim() ? Number(budget.replace(/[^\d]/g, "")) : undefined;
    startTransition(async () => {
      const res = await convertLeadToProject({
        leadId: lead.id,
        title: title.trim(),
        budget: parsedBudget ?? null,
      });
      if (res.ok) {
        router.push(`/admin/projets/${res.projectId}`);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <CardShell title="Convertir en projet" icon={<Rocket className="h-4 w-4" />}>
      <p className="mb-4 text-xs text-text-secondary">
        Crée un projet client à partir de ce lead et le marque comme gagné.
      </p>
      <div className="flex flex-col gap-3">
        <Field label="Titre du projet" htmlFor="conv-title">
          <Input
            id="conv-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Site vitrine Boutique Élégance"
          />
        </Field>
        <Field label="Budget estimé (FCFA)" htmlFor="conv-budget" hint="Optionnel — chiffres uniquement.">
          <Input
            id="conv-budget"
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="1 500 000"
          />
        </Field>
        <button
          type="button"
          onClick={convert}
          disabled={pending || title.trim().length < 3}
          className={cn(buttonClasses({ variant: "primary", size: "md" }), "w-full disabled:opacity-50")}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Conversion…
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Convertir en projet
            </>
          )}
        </button>
      </div>
      <Feedback error={error} saved={false} />
    </CardShell>
  );
}

/* ─────────────────────────── Zone dangereuse ───────────────────────────── */

function DangerCard({ lead }: { lead: LeadDetail }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteLead({ id: lead.id });
      if (res.ok) router.push("/admin/leads");
      else {
        setError(res.error);
        setConfirming(false);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-error/20 bg-error/[0.03] p-5">
      <h3 className="flex items-center gap-2 font-display text-sm font-bold text-error">
        <AlertTriangle className="h-4 w-4" />
        Supprimer le lead
      </h3>
      <p className="mt-2 text-xs text-text-secondary">
        Le lead sera retiré du pipeline (suppression réversible côté base).
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-xs font-semibold text-navy">Confirmer la suppression ?</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-error px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Oui, supprimer
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="flex-1 rounded-lg border border-navy/[0.12] px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/[0.04]"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="trigger"
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-error/30 px-3 py-2 text-xs font-semibold text-error transition-colors hover:bg-error/10"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer ce lead
          </motion.button>
        )}
      </AnimatePresence>
      {error && <p className="mt-2 text-xs font-medium text-error">{error}</p>}
    </section>
  );
}
