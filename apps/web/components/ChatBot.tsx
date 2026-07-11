"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles, Send, X, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@da/ui";
import { siteConfig } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Assistant IA du site — bouton flottant + panneau de chat (remplace le FAB
   WhatsApp). Streaming depuis /api/chat, rendu markdown, questions suggérées,
   et repli « parler à un conseiller sur WhatsApp ». Identité DA (dégradé
   signature, monogramme, micro-interactions Framer Motion).
   ══════════════════════════════════════════════════════════════════════════ */

type ChatMessage = { role: "user" | "assistant"; content: string };

const GREETING =
  "Bonjour 👋 Je suis l'assistant de **Digital Access**. Posez-moi vos questions sur nos **services**, nos **tarifs**, nos **délais** ou l'**Access Academy** — je vous oriente en un clin d'œil.";

const QUICK_REPLIES = [
  "Quels sont vos tarifs ?",
  "Je veux créer un site vitrine",
  "Combien de temps pour un site ?",
  "C'est quoi l'Access Academy ?",
];

const WHATSAPP_HREF = `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
  "Bonjour Digital Access, je souhaite parler à un conseiller.",
)}`;

/* ── Rendu markdown d'un message de l'assistant ────────────────────────── */
function AssistantMarkdown({ content, onNavigate }: { content: string; onNavigate: () => void }) {
  return (
    <div className="da-chat-md text-[13.5px] leading-relaxed text-navy">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="marker:text-brand-blue-vif">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-navy">{children}</strong>,
          a: ({ href = "", children }) => {
            const isInternal = href.startsWith("/");
            const cls =
              "font-semibold text-brand-blue-royal underline decoration-brand-cyan/40 underline-offset-2 hover:text-brand-violet";
            if (isInternal) {
              return (
                <Link href={href} onClick={onNavigate} className={cls}>
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                {children}
              </a>
            );
          },
          code: ({ children }) => (
            <code className="rounded bg-surface-secondary px-1 py-0.5 font-mono text-[12px] text-brand-violet">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ── Indicateur « en train d'écrire » ──────────────────────────────────── */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="L'assistant écrit…">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-brand-blue-vif"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export function ChatBot() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const reduce = useReducedMotion();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Défilement automatique vers le bas.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, open, busy, reduce]);

  // Focus sur le champ à l'ouverture + fermeture avec Échap.
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 220);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Annuler un flux en cours si le composant est démonté.
  React.useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;

    const history = [...messages, { role: "user" as const, content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("bad-response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((cur) => {
          const copy = cur.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (!acc.trim()) throw new Error("empty");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setMessages((cur) => {
        const copy = cur.slice();
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "Désolé, je rencontre un souci technique. Vous pouvez nous joindre sur [WhatsApp](" +
            WHATSAPP_HREF +
            ") ou via la [page contact](/contact).",
        };
        return copy;
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onTextareaKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }

  const lastIsEmptyAssistant =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  return (
    <>
      {/* ── Bouton flottant ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir l'assistant Digital Access"
            initial={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            whileHover={reduce ? undefined : { scale: 1.06 }}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            className="group fixed bottom-4 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-da text-white shadow-lg shadow-brand-violet/30 sm:bottom-6 sm:right-6"
          >
            {!reduce && (
              <span
                className="absolute inset-0 rounded-full bg-brand-blue-vif/60 animate-pulse-ring"
                aria-hidden
              />
            )}
            <Sparkles size={24} className="relative" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-success" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Panneau de chat ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Assistant Digital Access"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-4 right-4 z-50 flex h-[min(70vh,600px)] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-2xl sm:bottom-6 sm:right-6"
          >
            {/* En-tête */}
            <div className="relative flex items-center gap-3 bg-gradient-da px-4 py-3.5 text-white">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <Sparkles size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold leading-tight">Assistant Digital Access</p>
                <p className="flex items-center gap-1.5 text-xs text-white/85">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                  En ligne · Réponses par IA
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer l'assistant"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Fil de discussion */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-surface-secondary/40 px-3.5 py-4"
              aria-live="polite"
            >
              {/* Message d'accueil */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-navy/[0.06] bg-surface-primary px-3.5 py-2.5 shadow-sm">
                  <AssistantMarkdown content={GREETING} onNavigate={() => setOpen(false)} />
                </div>
              </div>

              {/* Questions suggérées (au début uniquement) */}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      className="rounded-full border border-brand-blue-vif/30 bg-surface-primary px-3 py-1.5 text-xs font-medium text-brand-blue-royal transition-colors hover:border-transparent hover:bg-gradient-da hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages */}
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                const isLastEmpty = lastIsEmptyAssistant && i === messages.length - 1;
                return (
                  <div key={i} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-sm",
                        isUser
                          ? "rounded-2xl rounded-tr-sm bg-gradient-da text-white"
                          : "rounded-2xl rounded-tl-sm border border-navy/[0.06] bg-surface-primary",
                      )}
                    >
                      {isUser ? (
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      ) : isLastEmpty ? (
                        <TypingDots />
                      ) : (
                        <AssistantMarkdown content={m.content} onNavigate={() => setOpen(false)} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Saisie */}
            <form onSubmit={onSubmit} className="border-t border-navy/[0.08] bg-surface-primary px-3 pb-2.5 pt-3">
              <div className="flex items-end gap-2 rounded-xl border border-navy/[0.12] bg-surface-primary px-3 py-1.5 focus-within:border-brand-blue-vif focus-within:ring-2 focus-within:ring-brand-blue-vif/20">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    autoGrow(e.target);
                  }}
                  onKeyDown={onTextareaKey}
                  rows={1}
                  maxLength={2000}
                  placeholder="Écrivez votre message…"
                  className="max-h-24 flex-1 resize-none border-0 bg-transparent py-1.5 text-sm text-navy outline-none placeholder:text-text-muted"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Envoyer"
                  className="mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-da text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-text-muted">
                <span>Propulsé par l'IA · peut se tromper</span>
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#25D366] hover:underline"
                >
                  <MessageSquare size={12} fill="currentColor" strokeWidth={0} />
                  Parler à un conseiller
                </a>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
