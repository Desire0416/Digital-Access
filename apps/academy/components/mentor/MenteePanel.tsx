"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  StickyNote,
  Send,
  CalendarPlus,
  Flag,
  History,
  Loader2,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Video,
} from "lucide-react";
import { cn } from "@da/ui";
import type { MentorMessageRow } from "@/lib/mentor";
import {
  updateMenteeNote,
  sendMentorMessage,
  proposeMeeting,
  flagMentee,
  type MentorActionResult,
} from "@/lib/mentor-actions";
import { Markdown } from "@/components/Markdown";

/* ══════════════════════════════════════════════════════════════════════════
   Panneau d'accompagnement du mentoré (cahier §7.5) — UI cliente réservée au
   mentor. Toutes les actions revérifient l'assignation côté serveur ; ici on
   borne la saisie, on affiche un retour inline et on router.refresh() au succès.
   ══════════════════════════════════════════════════════════════════════════ */

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function MenteePanel({
  learnerId,
  note,
  messages,
}: {
  learnerId: string;
  note: string | null;
  messages: MentorMessageRow[];
}) {
  return (
    <div className="space-y-5">
      <NoteSection learnerId={learnerId} initialNote={note ?? ""} />
      <MessageSection learnerId={learnerId} />
      <MeetingSection learnerId={learnerId} />
      <FlagSection learnerId={learnerId} />
      <HistorySection messages={messages} />
    </div>
  );
}

/* ─── Enveloppe de section ──────────────────────────────────────────────────── */
function PanelCard({
  icon,
  title,
  children,
  tone = "default",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
      <div className="flex items-center gap-2.5 border-b border-navy/[0.06] bg-surface-secondary/60 px-4 py-3">
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg text-white",
            tone === "danger" ? "bg-error" : "bg-gradient-da",
          )}
          aria-hidden
        >
          {icon}
        </span>
        <p className="font-display text-sm font-bold text-navy">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ─── Retour inline (succès / erreur) ───────────────────────────────────────── */
function Feedback({ state }: { state: MentorActionResult | null }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {state && (
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 text-xs font-semibold",
            state.ok ? "text-success" : "text-error",
          )}
        >
          {state.ok && <CheckCircle2 size={13} aria-hidden />}
          {state.ok ? (state.message ?? "Enregistré.") : (state.error ?? "Une erreur est survenue.")}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/* ─── Bouton d'envoi au dégradé ─────────────────────────────────────────────── */
function SubmitButton({
  pending,
  disabled,
  children,
  tone = "default",
}: {
  pending: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        tone === "danger" ? "bg-error" : "bg-gradient-da shadow-brand",
      )}
    >
      {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-royal/50";

/* ─── Note privée ───────────────────────────────────────────────────────────── */
function NoteSection({ learnerId, initialNote }: { learnerId: string; initialNote: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialNote);
  const [pending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<MentorActionResult | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setState(null);
    startTransition(async () => {
      const res = await updateMenteeNote(learnerId, value.trim());
      setState(res);
      if (res.ok) router.refresh();
    });
  }

  const dirty = value.trim() !== initialNote.trim();

  return (
    <PanelCard icon={<StickyNote size={16} />} title="Note privée">
      <form onSubmit={submit}>
        <p className="mb-2 text-xs leading-relaxed text-text-secondary">
          Visible de vous seul. Notez vos observations, points de suivi et objectifs de coaching.
        </p>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 4000))}
          rows={4}
          placeholder="Vos notes sur cet apprenant…"
          maxLength={4000}
          className={cn(inputClass, "resize-none")}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <Feedback state={state} />
          <div className="ml-auto">
            <SubmitButton pending={pending} disabled={!dirty}>
              Enregistrer
            </SubmitButton>
          </div>
        </div>
      </form>
    </PanelCard>
  );
}

/* ─── Envoyer un message / une recommandation ───────────────────────────────── */
function MessageSection({ learnerId }: { learnerId: string }) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [kind, setKind] = React.useState<"MESSAGE" | "RECOMMENDATION">("MESSAGE");
  const [pending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<MentorActionResult | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setState(null);
    startTransition(async () => {
      const res = await sendMentorMessage(learnerId, { body: body.trim(), kind });
      setState(res);
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <PanelCard icon={<Send size={16} />} title="Envoyer un message">
      <form onSubmit={submit}>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <KindToggle
            active={kind === "MESSAGE"}
            onClick={() => setKind("MESSAGE")}
            icon={<MessageSquare size={14} aria-hidden />}
            label="Message"
          />
          <KindToggle
            active={kind === "RECOMMENDATION"}
            onClick={() => setKind("RECOMMENDATION")}
            icon={<Sparkles size={14} aria-hidden />}
            label="Recommandation"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 4000))}
          rows={4}
          placeholder={
            kind === "RECOMMENDATION"
              ? "Une ressource, un cours ou un conseil à recommander… (markdown pris en charge)"
              : "Votre message à l'apprenant… (markdown pris en charge)"
          }
          maxLength={4000}
          className={cn(inputClass, "resize-none")}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <Feedback state={state} />
          <div className="ml-auto">
            <SubmitButton pending={pending} disabled={body.trim().length < 1}>
              {kind === "RECOMMENDATION" ? "Recommander" : "Envoyer"}
            </SubmitButton>
          </div>
        </div>
      </form>
    </PanelCard>
  );
}

function KindToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
        active
          ? "border-transparent bg-brand-violet/[0.1] text-brand-violet"
          : "border-navy/12 text-text-secondary hover:border-navy/25 hover:text-navy",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ─── Proposer un rendez-vous ───────────────────────────────────────────────── */
function MeetingSection({ learnerId }: { learnerId: string }) {
  const router = useRouter();
  const [when, setWhen] = React.useState("");
  const [meetingUrl, setMeetingUrl] = React.useState("");
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<MentorActionResult | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setState(null);
    if (!when) {
      setState({ ok: false, error: "Choisissez une date et une heure." });
      return;
    }
    const iso = new Date(when).toISOString();
    startTransition(async () => {
      const res = await proposeMeeting(learnerId, {
        when: iso,
        meetingUrl: meetingUrl.trim() || undefined,
        note: note.trim() || undefined,
      });
      setState(res);
      if (res.ok) {
        setWhen("");
        setMeetingUrl("");
        setNote("");
        router.refresh();
      }
    });
  }

  return (
    <PanelCard icon={<CalendarPlus size={16} />} title="Proposer un rendez-vous">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="mentee-rdv-when" className="mb-1 block text-xs font-semibold text-text-secondary">
            Date et heure
          </label>
          <input
            id="mentee-rdv-when"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="mentee-rdv-url" className="mb-1 block text-xs font-semibold text-text-secondary">
            Lien de visio <span className="font-normal text-text-muted">(optionnel)</span>
          </label>
          <div className="relative">
            <Video
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              id="mentee-rdv-url"
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.example.com/…"
              className={cn(inputClass, "pl-9")}
            />
          </div>
        </div>
        <div>
          <label htmlFor="mentee-rdv-note" className="mb-1 block text-xs font-semibold text-text-secondary">
            Note <span className="font-normal text-text-muted">(optionnel)</span>
          </label>
          <textarea
            id="mentee-rdv-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 2000))}
            rows={2}
            placeholder="Ordre du jour, préparation attendue…"
            maxLength={2000}
            className={cn(inputClass, "resize-none")}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Feedback state={state} />
          <div className="ml-auto">
            <SubmitButton pending={pending} disabled={!when}>
              Proposer
            </SubmitButton>
          </div>
        </div>
      </form>
    </PanelCard>
  );
}

/* ─── Signaler en difficulté ────────────────────────────────────────────────── */
function FlagSection({ learnerId }: { learnerId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<MentorActionResult | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setState(null);
    startTransition(async () => {
      const res = await flagMentee(learnerId, reason.trim());
      setState(res);
      if (res.ok) {
        setReason("");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <PanelCard icon={<Flag size={16} />} title="Signaler en difficulté" tone="danger">
      <p className="text-xs leading-relaxed text-text-secondary">
        Alertez l&apos;équipe pédagogique lorsqu&apos;un apprenant a besoin d&apos;un accompagnement renforcé.
        Le signalement leur est transmis par notification.
      </p>

      {!open ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <Feedback state={state} />
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setState(null);
            }}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-error/30 px-4 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/[0.06]"
          >
            <Flag size={15} aria-hidden />
            Signaler
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="Motif du signalement (décrochage, difficultés répétées, absence prolongée…)"
            maxLength={1000}
            className={cn(inputClass, "resize-none")}
            autoFocus
          />
          <div className="flex items-center justify-between gap-3">
            <Feedback state={state} />
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setState(null);
                }}
                disabled={pending}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-navy/[0.05] disabled:opacity-60"
              >
                Annuler
              </button>
              <SubmitButton pending={pending} disabled={reason.trim().length < 3} tone="danger">
                Transmettre
              </SubmitButton>
            </div>
          </div>
        </form>
      )}
    </PanelCard>
  );
}

/* ─── Historique des messages ───────────────────────────────────────────────── */
function HistorySection({ messages }: { messages: MentorMessageRow[] }) {
  return (
    <PanelCard icon={<History size={16} />} title="Historique des échanges">
      {messages.length > 0 ? (
        <ul className="space-y-3">
          {messages.map((msg) => {
            const isReco = msg.kind === "RECOMMENDATION";
            return (
              <li
                key={msg.id}
                className={cn(
                  "rounded-xl border p-3.5",
                  isReco ? "border-brand-violet/25 bg-brand-violet/[0.04]" : "border-navy/[0.07] bg-surface-primary",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      isReco ? "bg-brand-violet/[0.12] text-brand-violet" : "bg-navy/[0.06] text-navy/70",
                    )}
                  >
                    {isReco ? <Sparkles size={10} aria-hidden /> : <MessageSquare size={10} aria-hidden />}
                    {isReco ? "Recommandation" : "Message"}
                  </span>
                  <span className="text-[11px] text-text-muted">{dateTimeFmt.format(msg.createdAt)}</span>
                </div>
                <Markdown className="prose-sm">{msg.body}</Markdown>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-3 text-center text-sm text-text-secondary">
          Aucun échange pour l&apos;instant. Envoyez un premier message ci-dessus.
        </p>
      )}
    </PanelCard>
  );
}

export default MenteePanel;
