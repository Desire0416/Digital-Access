"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, X, Check } from "lucide-react";
import { cn } from "@da/ui";
import { createFaqItem, updateFaqItem, deleteFaqItem, setFaqPublished } from "@/lib/support-admin-actions";

export interface FaqRow {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
}

const inputClass =
  "w-full rounded-lg border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors focus:border-brand-blue-vif/60";

function Editor({
  initial,
  onCancel,
  onDone,
}: {
  initial?: FaqRow;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [category, setCategory] = React.useState(initial?.category ?? "Général");
  const [question, setQuestion] = React.useState(initial?.question ?? "");
  const [answer, setAnswer] = React.useState(initial?.answer ?? "");
  const [order, setOrder] = React.useState(String(initial?.order ?? 0));
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState("");

  function save() {
    setError("");
    start(async () => {
      const payload = { category, question, answer, order: Number(order) || 0 };
      const res = initial ? await updateFaqItem(initial.id, payload) : await createFaqItem(payload);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-blue-vif/25 bg-brand-blue-vif/[0.03] p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Catégorie" className={inputClass} />
        <input value={order} onChange={(e) => setOrder(e.target.value)} type="number" min={0} placeholder="Ordre" className={inputClass} />
      </div>
      <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" className={inputClass} />
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} placeholder="Réponse (markdown accepté)" className={cn(inputClass, "resize-y")} />
      {error && <p className="text-sm font-medium text-error">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-navy/[0.05]">
          <X size={14} aria-hidden />
          Annuler
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending || !question.trim() || !answer.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
        >
          {pending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Check size={14} aria-hidden />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}

export function FaqManager({ items }: { items: FaqRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  function togglePublish(item: FaqRow) {
    start(async () => {
      await setFaqPublished(item.id, !item.published);
      router.refresh();
    });
  }
  function remove(item: FaqRow) {
    if (!window.confirm(`Supprimer « ${item.question} » ?`)) return;
    start(async () => {
      await deleteFaqItem(item.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {adding ? (
        <Editor onCancel={() => setAdding(false)} onDone={() => { setAdding(false); router.refresh(); }} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
        >
          <Plus size={16} aria-hidden />
          Nouvelle question
        </button>
      )}

      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-navy/[0.08] bg-surface-primary p-4">
            {editingId === item.id ? (
              <Editor initial={item} onCancel={() => setEditingId(null)} onDone={() => { setEditingId(null); router.refresh(); }} />
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-semibold text-text-secondary">{item.category}</span>
                    {!item.published && <span className="text-[11px] font-bold text-warning">Masquée</span>}
                  </div>
                  <p className="mt-1.5 font-display text-sm font-bold text-navy">{item.question}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{item.answer}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => togglePublish(item)} disabled={pending} title={item.published ? "Masquer" : "Publier"} className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy">
                    {item.published ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
                  </button>
                  <button type="button" onClick={() => setEditingId(item.id)} title="Modifier" className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-brand-blue-vif/[0.08] hover:text-brand-blue-royal">
                    <Pencil size={15} aria-hidden />
                  </button>
                  <button type="button" onClick={() => remove(item)} disabled={pending} title="Supprimer" className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/[0.08] hover:text-error">
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
