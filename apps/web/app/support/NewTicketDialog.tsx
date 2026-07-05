"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  X,
  AlertCircle,
  LifeBuoy,
  ChevronDown,
  Send,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Field,
  cn,
} from "@da/ui";
import type { TicketPriority } from "@/lib/portal-queries";
import { createTicket } from "@/lib/portal-actions";

const priorities: {
  value: TicketPriority;
  label: string;
  dot: string;
  activeRing: string;
  activeBg: string;
  activeText: string;
}[] = [
  {
    value: "LOW",
    label: "Basse",
    dot: "bg-text-muted",
    activeRing: "ring-navy/30",
    activeBg: "bg-navy/[0.05]",
    activeText: "text-navy",
  },
  {
    value: "MEDIUM",
    label: "Moyenne",
    dot: "bg-info",
    activeRing: "ring-info/40",
    activeBg: "bg-info/10",
    activeText: "text-info",
  },
  {
    value: "HIGH",
    label: "Haute",
    dot: "bg-warning",
    activeRing: "ring-warning/40",
    activeBg: "bg-warning/10",
    activeText: "text-[#B45309]",
  },
  {
    value: "URGENT",
    label: "Urgente",
    dot: "bg-error",
    activeRing: "ring-error/40",
    activeBg: "bg-error/10",
    activeText: "text-error",
  },
];

/** Bouton + modale de création de ticket. Formulaire animé, validation & erreurs par champ. */
export function NewTicketDialog({
  projects,
  variant = "primary",
  label = "Nouveau ticket",
}: {
  projects: { id: string; title: string }[];
  variant?: "primary" | "white" | "outline";
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant={variant} size="md" onClick={() => setOpen(true)}>
        <Plus size={17} />
        {label}
      </Button>

      <AnimatePresence>
        {open && (
          <Dialog
            projects={projects}
            onClose={() => setOpen(false)}
            onCreated={(ticketId) => {
              setOpen(false);
              router.push(`/support/${ticketId}`);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Dialog({
  projects,
  onClose,
  onCreated,
}: {
  projects: { id: string; title: string }[];
  onClose: () => void;
  onCreated: (ticketId: string) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<TicketPriority>("MEDIUM");
  const [projectId, setProjectId] = React.useState<string>("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const titleRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Fermeture au clavier + verrouillage du scroll d'arrière-plan.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await createTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        projectId: projectId || null,
      });
      if (res.ok) {
        onCreated(res.ticketId);
      } else {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-ticket-title"
    >
      {/* Voile */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-navy/50 backdrop-blur-sm"
      />

      {/* Panneau */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative z-10 my-8 w-full max-w-lg overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-2xl"
      >
        {/* Filet dégradé + en-tête */}
        <div className="relative border-b border-navy/[0.06] bg-grid px-6 py-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />
          <div className="flex items-start gap-3 pr-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-da text-white shadow-brand">
              <LifeBuoy size={20} />
            </span>
            <div>
              <h2
                id="new-ticket-title"
                className="font-display text-lg font-extrabold tracking-tight text-navy"
              >
                Ouvrir un ticket
              </h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                Décrivez votre demande, notre équipe vous répond au plus vite.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={submit} className="space-y-5 px-6 py-6">
          <Field
            label="Sujet"
            htmlFor="ticket-title"
            required
            error={fieldErrors.title}
          >
            <Input
              id="ticket-title"
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Problème d'affichage sur mobile"
              maxLength={160}
              error={Boolean(fieldErrors.title)}
              disabled={pending}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="ticket-description"
            required
            hint="Donnez un maximum de contexte : ce que vous observez, sur quelle page…"
            error={fieldErrors.description}
          >
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre demande en détail…"
              rows={5}
              maxLength={3000}
              error={Boolean(fieldErrors.description)}
              disabled={pending}
            />
          </Field>

          {/* Priorité en pills */}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-navy">Priorité</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {priorities.map((p) => {
                const active = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    disabled={pending}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all",
                      active
                        ? cn("border-transparent ring-2", p.activeRing, p.activeBg, p.activeText)
                        : "border-navy/12 text-text-secondary hover:border-navy/25 hover:text-navy",
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", p.dot)} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projet rattaché (optionnel) */}
          {projects.length > 0 && (
            <Field
              label="Projet concerné"
              htmlFor="ticket-project"
              hint="Optionnel — rattachez ce ticket à l'un de vos projets."
            >
              <div className="relative">
                <select
                  id="ticket-project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={pending}
                  className="h-11 w-full appearance-none rounded-lg border border-navy/15 bg-surface-primary px-4 pr-10 text-navy transition-all focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25 disabled:opacity-60"
                >
                  <option value="">Aucun projet particulier</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                />
              </div>
            </Field>
          )}

          {/* Erreur globale */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 rounded-lg bg-error/[0.06] px-3 py-2 text-xs font-medium text-error"
              >
                <AlertCircle size={14} />
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={pending}
              disabled={!title.trim() || !description.trim()}
            >
              <Send size={16} />
              Envoyer le ticket
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
