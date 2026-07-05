"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessagesSquare,
  Send,
  Loader2,
  ChevronDown,
  Check,
  ShieldCheck,
  Flag,
  Inbox,
} from "lucide-react";
import { cn, formatDate } from "@da/ui";
import {
  StatusPill,
  TICKET_PRIORITY,
  TICKET_STATUS,
  toneColor,
  type Tone,
} from "@/components/admin/ui";
import {
  replyToTicket,
  updateTicketStatus,
  updateTicketPriority,
} from "@/lib/admin-actions";
import type { TicketDetail } from "@/lib/admin-queries";

const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const PRIORITY_ORDER = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function TicketThread({ ticket }: { ticket: TicketDetail }) {
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

      {/* Colonne principale : conversation */}
      <div className="lg:col-span-2">
        <ConversationPanel ticket={ticket} setError={setError} />
      </div>

      {/* Colonne latérale : statut + priorité */}
      <div className="space-y-6">
        <StatusPanel ticket={ticket} setError={setError} />
        <PriorityPanel ticket={ticket} setError={setError} />
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

/* ═════════════════════════════ Conversation ═══════════════════════════════ */

function ConversationPanel({
  ticket,
  setError,
}: {
  ticket: TicketDetail;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [content, setContent] = React.useState("");
  const closed = ticket.status === "CLOSED";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = content.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      const res = await replyToTicket({ ticketId: ticket.id, content: value });
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
      icon={<MessagesSquare className="h-4 w-4" />}
      title="Conversation"
      action={
        <span className="rounded-full bg-navy/[0.05] px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
          {ticket.messages.length} message{ticket.messages.length > 1 ? "s" : ""}
        </span>
      }
      bodyClassName="p-0"
    >
      {/* Fil de discussion */}
      <div className="max-h-[520px] space-y-4 overflow-y-auto px-5 py-5 [scrollbar-width:thin]">
        {ticket.messages.length === 0 ? (
          <div className="py-8 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-navy/[0.04] text-text-muted">
              <Inbox className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm text-text-secondary">
              Aucun message pour l&apos;instant. Répondez au client pour démarrer
              l&apos;échange.
            </p>
          </div>
        ) : (
          ticket.messages.map((m) => (
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
      {closed ? (
        <div className="border-t border-navy/[0.06] bg-surface-secondary/40 px-5 py-4 text-center">
          <p className="text-xs font-medium text-text-secondary">
            Ce ticket est fermé. Rouvrez-le (statut « Ouvert » ou « En cours »)
            pour reprendre la conversation.
          </p>
        </div>
      ) : (
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
              placeholder="Répondre au client…"
              rows={2}
              maxLength={4000}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-navy/[0.12] bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
            />
            <button
              type="submit"
              disabled={pending || !content.trim()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-da text-white shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Envoyer la réponse"
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
      )}
    </Panel>
  );
}

/* ═══════════════════════════════ Statut ═══════════════════════════════════ */

function StatusPanel({
  ticket,
  setError,
}: {
  ticket: TicketDetail;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const meta = TICKET_STATUS[ticket.status]!;

  const change = (status: string) => {
    setOpen(false);
    if (status === ticket.status) return;
    setError(null);
    startTransition(async () => {
      const res = await updateTicketStatus({ id: ticket.id, status });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  return (
    <Panel icon={<ShieldCheck className="h-4 w-4" />} title="Statut">
      <Dropdown
        pending={pending}
        open={open}
        setOpen={setOpen}
        currentTone={meta.tone}
        currentLabel={meta.label}
        options={STATUS_ORDER.map((s) => ({
          value: s,
          ...TICKET_STATUS[s]!,
        }))}
        current={ticket.status}
        onSelect={change}
      />
      <p className="mt-3 text-xs leading-relaxed text-text-muted">
        Le client voit ce statut dans son espace support. Marquez « Résolu » une
        fois la demande traitée.
      </p>
    </Panel>
  );
}

/* ══════════════════════════════ Priorité ══════════════════════════════════ */

function PriorityPanel({
  ticket,
  setError,
}: {
  ticket: TicketDetail;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const meta = TICKET_PRIORITY[ticket.priority]!;

  const change = (priority: string) => {
    setOpen(false);
    if (priority === ticket.priority) return;
    setError(null);
    startTransition(async () => {
      const res = await updateTicketPriority({ id: ticket.id, priority });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  return (
    <Panel icon={<Flag className="h-4 w-4" />} title="Priorité">
      <Dropdown
        pending={pending}
        open={open}
        setOpen={setOpen}
        currentTone={meta.tone}
        currentLabel={meta.label}
        options={PRIORITY_ORDER.map((p) => ({
          value: p,
          ...TICKET_PRIORITY[p]!,
        }))}
        current={ticket.priority}
        onSelect={change}
      />
      <p className="mt-3 text-xs leading-relaxed text-text-muted">
        Ajustez la priorité pour ordonner la file de traitement. Les tickets
        urgents remontent en tête de liste.
      </p>
    </Panel>
  );
}

/* ═══════════════════════════ Sélecteur générique ══════════════════════════ */

function Dropdown({
  pending,
  open,
  setOpen,
  currentTone,
  currentLabel,
  options,
  current,
  onSelect,
}: {
  pending: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentTone: Tone;
  currentLabel: string;
  options: { value: string; label: string; tone: Tone }[];
  current: string;
  onSelect: (value: string) => void;
}) {
  return (
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
              style={{ background: toneColor(currentTone) }}
            />
          )}
          <span className="font-semibold text-navy">{currentLabel}</span>
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
              {options.map((o) => {
                const active = o.value === current;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => onSelect(o.value)}
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
                          style={{ background: toneColor(o.tone) }}
                        />
                        {o.label}
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
