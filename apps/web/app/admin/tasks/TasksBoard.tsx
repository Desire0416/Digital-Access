"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Plus, Pencil, Trash2, CalendarClock, AlertTriangle, Link2 } from "lucide-react";
import { Button, Card, cn, formatDate, StaggerGroup, StaggerItem } from "@da/ui";
import { Select } from "@/components/Select";
import { AdminPageHeader, EmptyState, StatusPill } from "@/components/admin/ui";
import { TaskFormModal } from "@/components/admin/TaskFormModal";
import { completeTask, deleteTask } from "@/lib/crm-task-actions";
import {
  TASK_TYPE_LABEL, PRIORITY_LABEL, PRIORITY_TONE, PRIORITY_VALUES,
} from "@/lib/crm-types";
import type { TaskRow, TaskCounts, AssignableUser } from "@/lib/crm-types";

const VIEW_TABS: { id: string; label: string; countKey?: keyof TaskCounts }[] = [
  { id: "open", label: "Ouvertes", countKey: "open" },
  { id: "today", label: "Aujourd'hui", countKey: "today" },
  { id: "overdue", label: "En retard", countKey: "overdue" },
  { id: "week", label: "Cette semaine", countKey: "week" },
  { id: "all", label: "Toutes" },
];

export function TasksBoard({
  tasks,
  counts,
  assignable,
  canAssign,
  filters,
}: {
  tasks: TaskRow[];
  counts: TaskCounts;
  assignable: AssignableUser[];
  canAssign: boolean;
  filters: { view: string; priority: string; assignee: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = React.useTransition();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaskRow | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const push = React.useCallback(
    (next: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v) sp.set(k, v);
        else sp.delete(k);
      }
      const qs = sp.toString();
      router.replace(qs ? `/admin/tasks?${qs}` : "/admin/tasks", { scroll: false });
    },
    [params, router],
  );

  const toggle = (t: TaskRow) => {
    setError(null);
    start(async () => {
      const res = await completeTask({ id: t.id, done: t.status !== "COMPLETED" });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };
  const remove = (t: TaskRow) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    setError(null);
    start(async () => {
      const res = await deleteTask({ id: t.id });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t: TaskRow) => { setEditing(t); setModalOpen(true); };

  return (
    <div>
      <AdminPageHeader title="Tâches & relances" description="Vos actions à mener sur les prospects, audits et projets.">
        <Button size="md" onClick={openNew}><Plus size={17} /> Nouvelle tâche</Button>
      </AdminPageHeader>

      {/* Vues rapides */}
      <div className="mb-5 flex flex-wrap gap-2">
        {VIEW_TABS.map((v) => {
          const active = filters.view === v.id;
          const count = v.countKey ? counts[v.countKey] : undefined;
          const danger = v.id === "overdue" && (count ?? 0) > 0;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => push({ view: v.id === "open" ? "" : v.id })}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-gradient-da text-white shadow-brand"
                  : danger
                    ? "border border-error/25 bg-error/[0.05] text-error hover:bg-error/10"
                    : "border border-navy/12 bg-surface-primary text-navy hover:border-brand-blue-vif/40",
              )}
            >
              {v.label}
              {typeof count === "number" && count > 0 && (
                <span className={cn("rounded-full px-1.5 text-xs font-bold", active ? "bg-white/25" : "bg-navy/[0.06]")}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtres secondaires */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="w-40">
          <Select
            value={filters.priority || ""}
            onChange={(v) => push({ priority: v })}
            placeholder="Priorité"
            options={[{ value: "", label: "Toutes priorités" }, ...PRIORITY_VALUES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))]}
            ariaLabel="Filtrer par priorité"
          />
        </div>
        {canAssign && (
          <div className="w-52">
            <Select
              value={filters.assignee || ""}
              onChange={(v) => push({ assignee: v })}
              placeholder="Responsable"
              options={[{ value: "", label: "Tous les responsables" }, ...assignable.map((u) => ({ value: u.id, label: u.name }))]}
              ariaLabel="Filtrer par responsable"
            />
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-sm font-medium text-error">{error}</p>}

      {tasks.length === 0 ? (
        <EmptyState icon={<Check size={22} />} title="Aucune tâche" description="Rien à faire ici. Créez une tâche pour planifier une relance ou une action.">
          <Button onClick={openNew}><Plus size={16} /> Nouvelle tâche</Button>
        </EmptyState>
      ) : (
        <StaggerGroup className="flex flex-col gap-2.5">
          {tasks.map((t) => {
            const done = t.status === "COMPLETED";
            return (
              <StaggerItem key={t.id}>
                <Card interactive={false} className="p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(t)}
                      disabled={pending}
                      aria-label={done ? "Rouvrir" : "Terminer"}
                      className={cn(
                        "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                        done ? "border-success bg-success text-white" : "border-navy/25 text-transparent hover:border-brand-blue-vif",
                      )}
                    >
                      <Check size={14} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("font-semibold text-navy", done && "text-text-muted line-through")}>{t.title}</p>
                        <StatusPill label={PRIORITY_LABEL[t.priority]} tone={PRIORITY_TONE[t.priority]} dot={false} />
                        <span className="rounded-full bg-navy/[0.05] px-2 py-0.5 text-xs font-medium text-text-secondary">{TASK_TYPE_LABEL[t.type]}</span>
                      </div>
                      {t.description && <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{t.description}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                        {t.dueDate && (
                          <span className={cn("inline-flex items-center gap-1", t.isOverdue && "font-semibold text-error")}>
                            {t.isOverdue ? <AlertTriangle size={13} /> : <CalendarClock size={13} />}
                            {t.isOverdue ? "En retard — " : ""}{formatDate(t.dueDate)}
                          </span>
                        )}
                        {t.context.label && (
                          t.context.href ? (
                            <Link href={t.context.href} className="inline-flex items-center gap-1 text-brand-blue-royal hover:text-brand-violet">
                              <Link2 size={13} /> {t.context.label}
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Link2 size={13} /> {t.context.label}</span>
                          )
                        )}
                        {t.assignedTo && <span>· {t.assignedTo.name}</span>}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => openEdit(t)} aria-label="Modifier" className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy">
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => remove(t)} aria-label="Supprimer" className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/[0.08] hover:text-error">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editing}
        assignable={assignable}
        canAssign={canAssign}
      />
    </div>
  );
}
