"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { UserCog, UserPlus, Search, Loader2, X, Users } from "lucide-react";
import { cn, Avatar } from "@da/ui";
import { assignMentee, removeMentorAssignment } from "@/lib/mentor-admin-actions";
import { Select } from "@/components/Select";
import { inputClass } from "./forms";
import { AdminCard, AdminEmpty } from "./ui";
import { useAdminAction, Feedback, SaveButton, DeleteButton } from "./action-hooks";

/* ══════════════════════════════════════════════════════════════════════════
   Assignation des mentorés (§7.5). L'admin choisit un mentor, recherche un
   apprenant (débounce → server action) puis l'assigne. Les assignations
   existantes sont listées, groupées par mentor, avec retrait unitaire.
   ══════════════════════════════════════════════════════════════════════════ */

type Assignment = {
  id: string;
  createdAt: Date | string;
  mentor: { id: string; name: string };
  learner: { id: string; name: string; email: string };
};
type Mentor = { id: string; name: string };
type Learner = { id: string; name: string; email: string };
type SearchLearnersFn = (q: string) => Promise<Learner[]>;

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
function formatDate(d: Date | string): string {
  return dateFmt.format(new Date(d));
}

export function MentorAssignments({
  assignments,
  mentors,
  searchLearners,
}: {
  assignments: Assignment[];
  mentors: Mentor[];
  searchLearners: SearchLearnersFn;
}) {
  const { pending, msg, run } = useAdminAction();
  const [mentorId, setMentorId] = React.useState<string | null>(null);
  const [learner, setLearner] = React.useState<Learner | null>(null);

  // Apprenants déjà suivis par le mentor sélectionné → exclus de la recherche.
  const excludeIds = React.useMemo(
    () => (mentorId ? assignments.filter((a) => a.mentor.id === mentorId).map((a) => a.learner.id) : []),
    [assignments, mentorId],
  );

  // Groupes mentor → apprenants (ordre déjà trié par nom de mentor côté requête).
  const groups = React.useMemo(() => {
    const map = new Map<string, { mentor: { id: string; name: string }; items: Assignment[] }>();
    for (const a of assignments) {
      const g = map.get(a.mentor.id) ?? { mentor: a.mentor, items: [] };
      g.items.push(a);
      map.set(a.mentor.id, g);
    }
    return [...map.values()];
  }, [assignments]);

  function assign() {
    if (!mentorId || !learner) return;
    run(() => assignMentee(mentorId, learner.id), {
      onOk: () => setLearner(null),
    });
  }

  return (
    <div className="space-y-6">
      {/* ─── Nouvelle assignation ──────────────────────────────────────────── */}
      <AdminCard className="p-5 sm:p-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-navy">
          <UserPlus size={17} className="text-brand-violet" /> Nouvelle assignation
        </h2>
        <p className="mb-4 text-sm text-text-secondary">
          Choisissez un mentor, puis recherchez l'apprenant à lui confier.
        </p>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Mentor */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-semibold text-navy">Mentor</label>
            {mentors.length === 0 ? (
              <p className="rounded-xl border border-dashed border-navy/15 px-3.5 py-3 text-sm text-text-muted">
                Aucun compte n'a le rôle mentor pour l'instant.
              </p>
            ) : (
              <Select
                value={mentorId}
                onChange={(v) => setMentorId(v || null)}
                ariaLabel="Mentor"
                placeholder="Sélectionner un mentor…"
                options={mentors.map((m) => ({
                  value: m.id,
                  label: m.name,
                  icon: <UserCog size={14} className="text-brand-blue-royal" />,
                }))}
              />
            )}
          </div>

          {/* Apprenant */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-semibold text-navy">Apprenant</label>
            {learner ? (
              <div className="flex items-center gap-3 rounded-xl border border-brand-blue-vif/30 bg-brand-blue-vif/[0.04] p-2.5">
                <Avatar name={learner.name} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{learner.name}</p>
                  <p className="truncate text-xs text-text-muted">{learner.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLearner(null)}
                  aria-label="Retirer l'apprenant sélectionné"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <LearnerSearch
                searchLearners={searchLearners}
                excludeIds={excludeIds}
                disabled={pending || !mentorId}
                onPick={setLearner}
              />
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <Feedback msg={msg} />
          <SaveButton pending={pending} onClick={assign} className={cn(!mentorId || !learner ? "pointer-events-none opacity-60" : "")}>
            Assigner
          </SaveButton>
        </div>
      </AdminCard>

      {/* ─── Assignations existantes (groupées par mentor) ─────────────────── */}
      {groups.length === 0 ? (
        <AdminCard className="p-0">
          <AdminEmpty
            title="Aucune assignation"
            description="Assignez un premier apprenant à un mentor à l'aide du formulaire ci-dessus."
          />
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <AdminCard key={g.mentor.id} className="overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b border-navy/[0.06] bg-surface-secondary/50 px-4 py-3 sm:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-sm" aria-hidden>
                  <UserCog size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-navy">{g.mentor.name}</p>
                  <p className="flex items-center gap-1 text-xs text-text-muted">
                    <Users size={12} aria-hidden />
                    {g.items.length} apprenant{g.items.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-navy/[0.05]">
                {g.items.map((a) => (
                  <MenteeRow key={a.id} assignment={a} pending={pending} onRemove={() => run(() => removeMentorAssignment(a.id))} />
                ))}
              </ul>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Ligne d'apprenant suivi ──────────────────────────────────────────────── */

function MenteeRow({
  assignment,
  pending,
  onRemove,
}: {
  assignment: Assignment;
  pending: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <Avatar name={assignment.learner.name} className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy">{assignment.learner.name}</p>
        <p className="truncate text-xs text-text-muted">{assignment.learner.email}</p>
      </div>
      <span className="hidden shrink-0 text-xs text-text-muted sm:block">Assigné le {formatDate(assignment.createdAt)}</span>
      <DeleteButton compact pending={pending} label="Retirer" onConfirm={onRemove} />
    </li>
  );
}

/* ─── Recherche d'apprenant (débounce → server action) ─────────────────────── */

function LearnerSearch({
  searchLearners,
  onPick,
  excludeIds,
  disabled,
}: {
  searchLearners: SearchLearnersFn;
  onPick: (learner: Learner) => void;
  excludeIds: string[];
  disabled?: boolean;
}) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Learner[]>([]);
  const [searching, startSearch] = React.useTransition();
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (disabled) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setTouched(false);
      return;
    }
    const t = window.setTimeout(() => {
      startSearch(async () => {
        const res = await searchLearners(term);
        setResults(res);
        setTouched(true);
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [q, searchLearners, disabled]);

  const filtered = results.filter((r) => !excludeIds.includes(r.id));

  return (
    <div>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
        {searching && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-blue-royal" aria-hidden />}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={disabled ? "Choisissez d'abord un mentor…" : "Rechercher par nom ou email…"}
          className={cn(inputClass, "pl-9")}
          disabled={disabled}
        />
      </div>
      {!disabled && q.trim().length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-navy/[0.08] p-1"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-text-muted">
              {touched && !searching ? "Aucun apprenant trouvé." : "Recherche…"}
            </p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onPick(u)}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-brand-blue-vif/[0.06]"
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
        </motion.div>
      )}
    </div>
  );
}
