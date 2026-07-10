"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea } from "@da/ui";
import { Select } from "@/components/Select";
import { Modal } from "@/components/admin/Modal";
import { createTask, updateTask } from "@/lib/crm-task-actions";
import {
  TASK_TYPE_VALUES, TASK_TYPE_LABEL, PRIORITY_VALUES, PRIORITY_LABEL,
} from "@/lib/crm-types";
import type { TaskRow, AssignableUser } from "@/lib/crm-types";

/** Rattachement facultatif (fiche prospect, etc.). */
export interface TaskContextInput {
  prospectId?: string;
  dealId?: string;
  leadId?: string;
  projectId?: string;
  organizationId?: string;
}

const isoToDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function TaskFormModal({
  open,
  onClose,
  task,
  context,
  assignable,
  canAssign,
}: {
  open: boolean;
  onClose: () => void;
  task?: TaskRow | null;
  context?: TaskContextInput;
  assignable: AssignableUser[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<string>("FOLLOW_UP");
  const [priority, setPriority] = React.useState<string>("MEDIUM");
  const [dueDate, setDueDate] = React.useState("");
  const [assignedToId, setAssignedToId] = React.useState("");

  // Réinitialise à l'ouverture / au changement de tâche.
  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setFieldErrors({});
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setType(task?.type ?? "FOLLOW_UP");
    setPriority(task?.priority ?? "MEDIUM");
    setDueDate(isoToDateInput(task?.dueDate ?? null));
    setAssignedToId(task?.assignedTo?.id ?? "");
  }, [open, task]);

  const submit = () => {
    setError(null);
    setFieldErrors({});
    start(async () => {
      const base = { title, description, type, priority, dueDate: dueDate || undefined, assignedToId: assignedToId || undefined };
      const res = task
        ? await updateTask({ id: task.id, ...base })
        : await createTask({ ...context, ...base });
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setError(res.error);
        if ("fieldErrors" in res && res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? "Modifier la tâche" : "Nouvelle tâche"} size="md">
      <div className="flex flex-col gap-4">
        <Field label="Intitulé" required error={fieldErrors.title}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Rappeler le directeur" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select
              value={type}
              onChange={setType}
              options={TASK_TYPE_VALUES.map((v) => ({ value: v, label: TASK_TYPE_LABEL[v] }))}
              ariaLabel="Type de tâche"
            />
          </Field>
          <Field label="Priorité">
            <Select
              value={priority}
              onChange={setPriority}
              options={PRIORITY_VALUES.map((v) => ({ value: v, label: PRIORITY_LABEL[v] }))}
              ariaLabel="Priorité"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Échéance">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          {canAssign && (
            <Field label="Responsable">
              <Select
                value={assignedToId || ""}
                onChange={setAssignedToId}
                placeholder="Moi"
                options={[{ value: "", label: "Moi" }, ...assignable.map((u) => ({ value: u.id, label: u.name }))]}
                ariaLabel="Responsable"
              />
            </Field>
          )}
        </div>

        <Field label="Détails">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Contexte, points à aborder…" />
        </Field>

        {error && <p className="text-sm font-medium text-error">{error}</p>}
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={pending}>Annuler</Button>
        <Button onClick={submit} loading={pending} disabled={title.trim().length < 2}>
          {task ? "Enregistrer" : "Créer la tâche"}
        </Button>
      </div>
    </Modal>
  );
}
