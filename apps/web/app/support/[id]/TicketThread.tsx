"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Avatar, Button, Textarea, cn, formatDate } from "@da/ui";
import type {
  TicketMessageItem,
  TicketStatus,
} from "@/lib/portal-queries";
import { postTicketMessage, closeTicket } from "@/lib/portal-actions";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Fil de discussion du ticket : bulles équipe DA vs client, formulaire de réponse,
 * bandeau « résolu » et bouton « Marquer comme résolu ».
 */
export function TicketThread({
  ticketId,
  status,
  clientName,
  description,
  createdAt,
  messages,
}: {
  ticketId: string;
  status: TicketStatus;
  clientName: string;
  description: string;
  createdAt: string;
  messages: TicketMessageItem[];
}) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [closing, startClosing] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const isResolved = status === "RESOLVED" || status === "CLOSED";

  // Auto-scroll en bas du fil à chaque nouveau message.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const value = content.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      const res = await postTicketMessage({ ticketId, content: value });
      if (res.ok) {
        setContent("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function resolve() {
    setError(null);
    startClosing(async () => {
      const res = await closeTicket(ticketId);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
      {/* En-tête du fil */}
      <div className="flex items-center gap-2 border-b border-navy/[0.07] bg-surface-secondary/40 px-5 py-3.5">
        <MessageSquare size={17} className="text-brand-blue-royal" />
        <h2 className="font-display text-base font-bold text-navy">
          Fil de discussion
        </h2>
        <span className="ml-auto text-xs text-text-muted">
          {messages.length} réponse{messages.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Corps : message initial + réponses */}
      <div
        ref={scrollRef}
        className="flex max-h-[34rem] min-h-[18rem] flex-col gap-4 overflow-y-auto p-5"
      >
        {/* Message initial (client) */}
        <Bubble
          team={false}
          name={clientName}
          content={description}
          createdAt={createdAt}
          isOpening
        />

        {messages.map((m) => (
          <Bubble
            key={m.id}
            team={m.author.isTeam}
            name={m.author.isTeam ? "Digital Access" : clientName}
            content={m.content}
            createdAt={m.createdAt}
          />
        ))}
      </div>

      {/* Bandeau résolu */}
      <AnimatePresence>
        {isResolved && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 border-t border-success/20 bg-success/[0.06] px-5 py-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 size={18} />
            </span>
            <div className="text-sm">
              <p className="font-semibold text-success">
                Ticket {status === "CLOSED" ? "fermé" : "résolu"}
              </p>
              <p className="mt-0.5 text-text-secondary">
                Répondre ci-dessous rouvrira automatiquement le ticket.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulaire de réponse */}
      <form onSubmit={send} className="border-t border-navy/[0.07] p-4">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2 flex items-center gap-1.5 text-xs font-medium text-error"
            >
              <AlertCircle size={13} />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e);
            }}
            placeholder={
              isResolved
                ? "Répondre pour rouvrir le ticket…"
                : "Écrivez votre réponse à l'équipe…"
            }
            className="min-h-12 flex-1"
            rows={2}
            disabled={pending}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={pending}
            disabled={!content.trim()}
            className="sm:self-stretch"
          >
            <Send size={16} />
            <span className="sm:hidden">Envoyer</span>
          </Button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-text-muted">
            Astuce&nbsp;: Ctrl/⌘ + Entrée pour envoyer.
          </p>
          {!isResolved && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={closing}
              onClick={resolve}
            >
              <ShieldCheck size={15} />
              Marquer comme résolu
            </Button>
          )}
          {isResolved && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
              <RotateCcw size={12} />
              Une réponse rouvrira ce ticket.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Bubble({
  team,
  name,
  content,
  createdAt,
  isOpening,
}: {
  team: boolean;
  name: string;
  content: string;
  createdAt: string;
  isOpening?: boolean;
}) {
  return (
    <div className={cn("flex items-end gap-2.5", team ? "justify-start" : "justify-end")}>
      {team && <Avatar name="Digital Access" className="h-8 w-8 shrink-0 text-[11px]" />}
      <div className="max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            team
              ? "rounded-bl-sm bg-surface-secondary text-navy"
              : isOpening
                ? "rounded-br-sm border border-brand-blue-vif/25 bg-brand-blue-vif/[0.06] text-navy"
                : "rounded-br-sm bg-gradient-da text-white shadow-brand",
          )}
        >
          {isOpening && (
            <p
              className={cn(
                "mb-1 text-[10px] font-bold uppercase tracking-wide",
                "text-brand-blue-royal",
              )}
            >
              Demande initiale
            </p>
          )}
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
        <p
          className={cn(
            "mt-1 px-1 text-[11px] text-text-muted",
            team ? "text-left" : "text-right",
          )}
        >
          <span className="font-medium text-text-secondary">
            {team ? "Équipe DA" : name}
          </span>{" "}
          · {formatDate(createdAt)} {formatTime(createdAt)}
        </p>
      </div>
      {!team && <Avatar name={name} className="h-8 w-8 shrink-0 text-[11px]" />}
    </div>
  );
}
