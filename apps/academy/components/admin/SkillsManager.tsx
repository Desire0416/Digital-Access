"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Plus, Layers, Pencil, X, FolderTree, Hash } from "lucide-react";
import { cn } from "@da/ui";
import { inputClass, textareaClass } from "@/components/admin/forms";
import { AdminCard, StatusPill, type PillTone } from "@/components/admin/ui";
import { EmptyState } from "@/components/EmptyState";
import { useAdminAction, Feedback, SaveButton, DeleteButton } from "@/components/admin/action-hooks";
import { createSkill, updateSkill, deleteSkill } from "@/lib/skill-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Gestion du référentiel de compétences (§21). Création + liste groupée par
   domaine avec édition inline et suppression (refusée côté serveur si la
   compétence est rattachée à ≥1 formation). Style DA : dégradé signature,
   cartes rounded-2xl, micro-interactions Framer Motion (reduced-motion OK).
   ══════════════════════════════════════════════════════════════════════════ */

type SkillRow = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  description: string | null;
  courseCount: number;
};

const NO_DOMAIN = "Sans domaine";

/** Groupe les compétences par domaine ; « Sans domaine » (domain null) en dernier. */
function groupByDomain(skills: SkillRow[]): { domain: string; isFallback: boolean; skills: SkillRow[] }[] {
  const map = new Map<string, SkillRow[]>();
  for (const s of skills) {
    const key = s.domain?.trim() || NO_DOMAIN;
    const list = map.get(key) ?? map.set(key, []).get(key)!;
    list.push(s);
  }
  return [...map.entries()]
    .map(([domain, list]) => ({
      domain,
      isFallback: domain === NO_DOMAIN,
      skills: [...list].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    }))
    .sort((a, b) => {
      if (a.isFallback !== b.isFallback) return a.isFallback ? 1 : -1;
      return a.domain.localeCompare(b.domain, "fr");
    });
}

export function SkillsManager({ skills }: { skills: SkillRow[] }) {
  const groups = React.useMemo(() => groupByDomain(skills), [skills]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <CreateForm />
      <div className="min-w-0 space-y-5">
        <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
          <Layers size={14} className="text-brand-blue-royal" />
          <span>
            {skills.length} compétence{skills.length > 1 ? "s" : ""}
            {groups.length > 0 && (
              <>
                {" · "}
                {groups.length} domaine{groups.length > 1 ? "s" : ""}
              </>
            )}
          </span>
        </div>

        {skills.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={40} className="text-text-muted opacity-50" />}
            title="Aucune compétence"
            description="Créez votre première compétence : elle pourra être rattachée aux formations et créditée au passeport des apprenants."
          />
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <DomainGroup key={g.domain} domain={g.domain} isFallback={g.isFallback} skills={g.skills} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Formulaire de création ───────────────────────────────────────────────── */

function CreateForm() {
  const reduce = useReducedMotion();
  const { pending, msg, setMsg, run } = useAdminAction();

  const [name, setName] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [description, setDescription] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (name.trim().length < 2) {
      setMsg({ ok: false, text: "Le nom doit contenir au moins 2 caractères." });
      return;
    }
    run(
      () =>
        createSkill({
          name: name.trim(),
          domain: domain.trim() || undefined,
          description: description.trim() || undefined,
        }),
      {
        onOk: () => {
          setName("");
          setDomain("");
          setDescription("");
        },
      },
    );
  }

  return (
    <AdminCard className="h-fit p-5 lg:sticky lg:top-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-sm" aria-hidden>
          <Sparkles size={17} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-navy">Nouvelle compétence</h2>
          <p className="text-xs text-text-muted">Rattachable aux formations</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="skill-name" className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-navy">
            Nom <span className="text-error">*</span>
          </label>
          <input
            id="skill-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. Modélisation de données"
            autoComplete="off"
            maxLength={80}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="skill-domain" className="mb-1.5 block text-sm font-semibold text-navy">
            Domaine <span className="font-normal text-text-muted">(optionnel)</span>
          </label>
          <input
            id="skill-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="ex. « Données », « Développement »"
            autoComplete="off"
            maxLength={60}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-text-muted">Regroupe les compétences par famille dans le référentiel.</p>
        </div>

        <div>
          <label htmlFor="skill-description" className="mb-1.5 block text-sm font-semibold text-navy">
            Description <span className="font-normal text-text-muted">(optionnel)</span>
          </label>
          <textarea
            id="skill-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ce que l'apprenant sait faire une fois la compétence acquise."
            maxLength={500}
            className={textareaClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            type="submit"
            disabled={pending}
            whileHover={reduce || pending ? undefined : { scale: 1.02 }}
            whileTap={reduce || pending ? undefined : { scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
          >
            <Plus size={16} />
            Créer la compétence
          </motion.button>
          <Feedback msg={msg} />
        </div>
      </form>
    </AdminCard>
  );
}

/* ─── Groupe par domaine ───────────────────────────────────────────────────── */

function DomainGroup({ domain, isFallback, skills }: { domain: string; isFallback: boolean; skills: SkillRow[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-lg text-white",
            isFallback ? "bg-navy/30" : "bg-gradient-da",
          )}
          aria-hidden
        >
          <FolderTree size={13} />
        </span>
        <h3 className={cn("font-display text-sm font-bold", isFallback ? "text-text-secondary" : "text-navy")}>
          {domain}
        </h3>
        <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
          {skills.length}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {skills.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <SkillItem skill={s} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── Ligne compétence (affichage + édition inline) ────────────────────────── */

function SkillItem({ skill }: { skill: SkillRow }) {
  const { pending, msg, setMsg, run } = useAdminAction();
  const [editing, setEditing] = React.useState(false);

  const [name, setName] = React.useState(skill.name);
  const [domain, setDomain] = React.useState(skill.domain ?? "");
  const [description, setDescription] = React.useState(skill.description ?? "");

  const attached = skill.courseCount > 0;
  const badgeTone: PillTone = attached ? "info" : "neutral";

  function openEdit() {
    setName(skill.name);
    setDomain(skill.domain ?? "");
    setDescription(skill.description ?? "");
    setMsg(null);
    setEditing(true);
  }

  function saveEdit() {
    setMsg(null);
    if (name.trim().length < 2) {
      setMsg({ ok: false, text: "Le nom doit contenir au moins 2 caractères." });
      return;
    }
    run(
      () =>
        updateSkill(skill.id, {
          name: name.trim(),
          domain: domain.trim() || undefined,
          description: description.trim() || undefined,
        }),
      { onOk: () => setEditing(false) },
    );
  }

  function remove() {
    setMsg(null);
    run(() => deleteSkill(skill.id));
  }

  return (
    <AdminCard className="p-4">
      {editing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue-royal">
              <Pencil size={13} /> Modifier
            </span>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setMsg(null);
              }}
              className="grid h-7 w-7 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
              aria-label="Annuler l'édition"
            >
              <X size={15} />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-navy">Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-navy">Domaine</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Optionnel"
              maxLength={60}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-navy">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionnel"
              maxLength={500}
              className={textareaClass}
            />
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <Hash size={11} />
            <span className="font-mono">{skill.slug}</span>
            <span>· identifiant figé après création</span>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <SaveButton pending={pending} onClick={saveEdit}>
              Enregistrer
            </SaveButton>
            <Feedback msg={msg} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-sm font-bold text-navy">{skill.name}</p>
              <StatusPill
                label={`${skill.courseCount} formation${skill.courseCount > 1 ? "s" : ""}`}
                tone={badgeTone}
              />
            </div>
            <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-text-muted">
              <Hash size={11} className="shrink-0" />
              <span className="truncate">{skill.slug}</span>
            </p>
            {skill.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">{skill.description}</p>
            )}
            {msg && !msg.ok && <p className="mt-1.5 text-xs font-medium text-error">{msg.text}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={openEdit}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand-blue-vif/30 hover:text-brand-blue-royal disabled:opacity-50"
            >
              <Pencil size={13} />
              <span className="hidden sm:inline">Modifier</span>
            </button>
            <DeleteButton
              onConfirm={remove}
              pending={pending}
              label="Supprimer"
              compact
            />
          </div>
        </div>
      )}
    </AdminCard>
  );
}
