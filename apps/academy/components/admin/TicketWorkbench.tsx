"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, SlidersHorizontal, UserCheck } from "lucide-react";
import { cn } from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { staffReplyToTicket, setTicketStatus, setTicketPriority, assignTicket } from "@/lib/support-admin-actions";
import { TICKET_STATUS_LABEL, TICKET_PRIORITY_LABEL } from "@/lib/support-labels";
import type { TicketStatus, TicketPriority } from "@da/academy-db/client";

const STATUSES = Object.keys(TICKET_STATUS_LABEL) as TicketStatus[];
const PRIORITIES = Object.keys(TICKET_PRIORITY_LABEL) as TicketPriority[];
const selectClass =
  "h-10 rounded-lg border border-navy/12 bg-surface-primary px-2.5 text-sm text-navy outline-none transition-colors focus:border-brand-blue-vif/60";

export function TicketWorkbench({
  ticketId,
  status,
  priority,
  assignedToId,
  staff,
}: {
  ticketId: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedToId: string | null;
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [screenshot, setScreenshot] = React.useState<string | null>(null);
  const [replyStatus, setReplyStatus] = React.useState<TicketStatus>("WAITING_LEARNER");
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3000);
  }

  function sendReply() {
    if (!body.trim()) return;
    start(async () => {
      const attachments = screenshot ? [{ url: screenshot, name: "Capture" }] : undefined;
      const res = await staffReplyToTicket(ticketId, { body, attachments, newStatus: replyStatus });
      if (res.ok) {
        setBody("");
        setScreenshot(null);
        router.refresh();
        flash(true, res.message ?? "Réponse envoyée.");
      } else {
        flash(false, res.error);
      }
    });
  }

  function runControl(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        router.refresh();
        flash(true, res.message ?? "Mis à jour.");
      } else {
        flash(false, res.error ?? "Erreur.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Contrôles */}
      <div className="rounded-2xl border border-navy/[0.08] bg-surface-secondary/40 p-4">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-violet">
          <SlidersHorizontal size={13} aria-hidden />
          Traitement
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Statut</span>
            <select
              value={status}
              onChange={(e) => runControl(() => setTicketStatus(ticketId, e.target.value as TicketStatus))}
              disabled={pending}
              className={cn(selectClass, "w-full")}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TICKET_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Priorité</span>
            <select
              value={priority}
              onChange={(e) => runControl(() => setTicketPriority(ticketId, e.target.value as TicketPriority))}
              disabled={pending}
              className={cn(selectClass, "w-full")}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TICKET_PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Assigné à</span>
            <select
              value={assignedToId ?? ""}
              onChange={(e) => runControl(() => assignTicket(ticketId, e.target.value || null))}
              disabled={pending}
              className={cn(selectClass, "w-full")}
            >
              <option value="">Non assigné</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Réponse du support */}
      <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-4">
        <p className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-navy">
          <UserCheck size={15} className="text-brand-blue-royal" aria-hidden />
          Répondre à l'apprenant
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={6000}
          placeholder="Votre réponse (markdown accepté)…"
          className="w-full resize-y rounded-lg border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors focus:border-brand-blue-vif/60"
        />
        <div className="mt-3">
          <ImageUpload value={screenshot} onChange={setScreenshot} folder="support" aspect="16 / 6" hint="Capture facultative" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-text-secondary">
            Passer le statut à
            <select
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value as TicketStatus)}
              className={selectClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TICKET_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3">
            {msg && <span className={cn("text-sm font-medium", msg.ok ? "text-success" : "text-error")}>{msg.text}</span>}
            <button
              type="button"
              onClick={sendReply}
              disabled={pending || !body.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />}
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
