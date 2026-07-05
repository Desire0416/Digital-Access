"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Send, MessageSquare, AlertCircle } from "lucide-react";
import { Avatar, Button, Textarea, formatDate, cn } from "@da/ui";
import type { ProjectMessageItem } from "@/lib/portal-queries";
import { postProjectMessage } from "@/lib/portal-actions";

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

/** Fil de messages du projet + formulaire d'envoi. Bulles alignées selon l'auteur. */
export function ProjectChat({
  projectId,
  clientName,
  messages,
}: {
  projectId: string;
  clientName: string;
  messages: ProjectMessageItem[];
}) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll en bas à chaque nouveau message.
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
      const res = await postProjectMessage({ projectId, content: value });
      if (res.ok) {
        setContent("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary">
      {/* En-tête */}
      <div className="flex items-center gap-2 border-b border-navy/[0.07] bg-surface-secondary/40 px-5 py-3.5">
        <MessageSquare size={17} className="text-brand-blue-royal" />
        <h2 className="font-display text-base font-bold text-navy">Messagerie du projet</h2>
        <span className="ml-auto text-xs text-text-muted">
          {messages.length} message{messages.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Fil de messages */}
      <div
        ref={scrollRef}
        className="flex max-h-[28rem] min-h-[16rem] flex-col gap-4 overflow-y-auto p-5"
      >
        {messages.length === 0 ? (
          <div className="m-auto max-w-xs text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-vif/10 text-brand-blue-royal">
              <MessageSquare size={22} />
            </span>
            <p className="mt-3 text-sm font-medium text-navy">Aucun message pour le moment</p>
            <p className="mt-1 text-xs text-text-muted">
              Écrivez à l'équipe Digital Access pour toute question sur votre projet.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const team = m.author.isTeam;
            return (
              <div
                key={m.id}
                className={cn("flex items-end gap-2.5", team ? "justify-start" : "justify-end")}
              >
                {team && (
                  <Avatar name="Digital Access" className="h-8 w-8 shrink-0 text-[11px]" />
                )}
                <div className={cn("max-w-[78%]", !team && "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      team
                        ? "rounded-bl-sm bg-surface-secondary text-navy"
                        : "rounded-br-sm bg-gradient-da text-white shadow-brand",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                  <p
                    className={cn(
                      "mt-1 px-1 text-[11px] text-text-muted",
                      team ? "text-left" : "text-right",
                    )}
                  >
                    <span className="font-medium text-text-secondary">
                      {team ? "Équipe DA" : "Vous"}
                    </span>{" "}
                    · {formatDate(m.createdAt)} {formatTime(m.createdAt)}
                  </p>
                </div>
                {!team && (
                  <Avatar name={clientName} className="h-8 w-8 shrink-0 text-[11px]" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Formulaire */}
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
            placeholder="Écrivez un message à l'équipe…"
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
        <p className="mt-1.5 text-[11px] text-text-muted">
          Astuce&nbsp;: Ctrl/⌘ + Entrée pour envoyer.
        </p>
      </form>
    </div>
  );
}
