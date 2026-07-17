"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Loader2, Send, CheckCircle2, ShieldCheck, Info } from "lucide-react";
import { cn, Avatar } from "@da/ui";
import { Markdown } from "@/components/Markdown";
import { ImageUpload } from "@/components/ImageUpload";
import { replyToTicket, closeMyTicket } from "@/lib/support-actions";
import type { TicketView } from "@/lib/support";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/* Fil d'un ticket côté apprenant : messages + réponse + clôture (§35.2). */
export function TicketThread({ ticket }: { ticket: TicketView }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [body, setBody] = React.useState("");
  const [screenshot, setScreenshot] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState("");

  function send() {
    if (!body.trim()) return;
    setError("");
    start(async () => {
      const attachments = screenshot ? [{ url: screenshot, name: "Capture" }] : undefined;
      const res = await replyToTicket(ticket.id, { body, attachments });
      if (res.ok) {
        setBody("");
        setScreenshot(null);
        router.refresh();
      } else if (res.redirect) {
        router.push(res.redirect);
      } else {
        setError(res.error ?? "Une erreur est survenue.");
      }
    });
  }

  function close() {
    setError("");
    start(async () => {
      const res = await closeMyTicket(ticket.id);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Une erreur est survenue.");
    });
  }

  return (
    <div className="space-y-4">
      <motion.ul
        initial={reduce ? false : "hidden"}
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        className="space-y-3"
      >
        {ticket.messages.map((m) =>
          m.isSystem ? (
            <li key={m.id} className="flex items-center justify-center gap-2 py-1 text-xs text-text-muted">
              <Info size={13} aria-hidden />
              <span>
                {m.body} · {dateFmt.format(m.createdAt)}
              </span>
            </li>
          ) : (
            <motion.li
              key={m.id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              className={cn("flex gap-3", m.fromStaff ? "flex-row" : "flex-row-reverse")}
            >
              <div className="shrink-0">
                {m.fromStaff ? (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-da text-white shadow-brand" aria-hidden>
                    <ShieldCheck size={16} />
                  </span>
                ) : (
                  <Avatar name={m.authorName ?? "Vous"} className="h-9 w-9" />
                )}
              </div>
              <div
                className={cn(
                  "min-w-0 max-w-[85%] rounded-2xl border p-3.5",
                  m.fromStaff
                    ? "border-brand-blue-vif/20 bg-brand-blue-vif/[0.05]"
                    : "border-navy/[0.07] bg-surface-primary",
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-navy">
                    {m.fromStaff ? "Support Access Academy" : m.authorName ?? "Vous"}
                  </span>
                  <span className="text-[11px] text-text-muted">{dateFmt.format(m.createdAt)}</span>
                </div>
                <Markdown className="prose-sm">{m.body}</Markdown>
                {m.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.attachments.map((a, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={a.url} alt={a.name} className="h-24 w-auto rounded-lg border border-navy/10 object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.li>
          ),
        )}
      </motion.ul>

      {ticket.canReply ? (
        <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={6000}
            placeholder="Votre réponse…"
            className="w-full resize-y rounded-lg border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors focus:border-brand-blue-vif/60"
          />
          <div className="mt-3">
            <ImageUpload value={screenshot} onChange={setScreenshot} folder="support" aspect="16 / 6" hint="Capture facultative — PNG/JPG 5 Mo max" />
          </div>
          {error && <p className="mt-2 text-sm font-medium text-error">{error}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-success/[0.08] hover:text-success disabled:opacity-60"
            >
              <CheckCircle2 size={15} aria-hidden />
              Ma demande est résolue
            </button>
            <button
              type="button"
              onClick={send}
              disabled={pending || !body.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />}
              Envoyer
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-navy/[0.08] bg-surface-secondary/60 px-4 py-4 text-center text-sm text-text-secondary">
          Cette demande est clôturée. Besoin d'aide à nouveau ?{" "}
          <a href="/espace/support" className="font-semibold text-brand-blue-royal hover:underline">
            Ouvrez une nouvelle demande
          </a>
          .
        </div>
      )}
    </div>
  );
}
