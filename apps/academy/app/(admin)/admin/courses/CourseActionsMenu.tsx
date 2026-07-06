"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Copy,
  ExternalLink,
  EyeOff,
  MessageSquareWarning,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button, Textarea, cn } from "@da/ui";
import {
  approveCourse,
  deleteCourse,
  duplicateCourse,
  rejectCourse,
  unpublishCourse,
} from "@/lib/studio-actions";
import type { AdminManagedCourse } from "./queries";

/* ══════════════════════════════════════════════════════════════════════════
   Menu d'actions concret d'un cours (dropdown rendu en PORTAIL → jamais clippé).
   Actions dépendantes du statut. Renvois (motif) et suppression passent par une
   confirmation. useTransition pour le pending, feedback inline en cas d'erreur.
   ══════════════════════════════════════════════════════════════════════════ */

type MenuAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  danger?: boolean;
};

export function CourseActionsMenu({
  course,
  onError,
}: {
  course: AdminManagedCourse;
  onError: (msg: string | null) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [flip, setFlip] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  // Confirmations (rendues en overlay plein écran).
  const [confirm, setConfirm] = React.useState<null | "reject" | "delete">(null);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  const reposition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect(r);
    const spaceBelow = window.innerHeight - r.bottom;
    setFlip(spaceBelow < 280 && r.top > spaceBelow);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    reposition();
    const onScroll = () => reposition();
    const onResize = () => reposition();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, reposition]);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    onError(null);
    setOpen(false);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) onError(res.error ?? "Une erreur est survenue.");
      else router.refresh();
    });
  }

  const isDraftOrReview = course.status === "DRAFT" || course.status === "REVIEW";

  const actions: MenuAction[] = [
    {
      key: "edit",
      label: "Éditer le cours",
      icon: <Pencil size={15} />,
      href: `/studio/courses/${course.id}/edit`,
    },
    {
      key: "preview",
      label: "Prévisualiser",
      icon: <ExternalLink size={15} />,
      href: `/courses/${course.slug}`,
      external: true,
    },
    ...(isDraftOrReview
      ? [
          {
            key: "approve",
            label: course.status === "REVIEW" ? "Valider et publier" : "Publier maintenant",
            icon: <BadgeCheck size={15} />,
            onClick: () => run(() => approveCourse(course.id)),
          },
        ]
      : []),
    ...(course.status === "REVIEW"
      ? [
          {
            key: "reject",
            label: "Renvoyer avec un motif",
            icon: <MessageSquareWarning size={15} />,
            onClick: () => {
              setOpen(false);
              setConfirm("reject");
            },
          },
        ]
      : []),
    ...(course.status === "PUBLISHED"
      ? [
          {
            key: "unpublish",
            label: "Dépublier",
            icon: <EyeOff size={15} />,
            onClick: () => run(() => unpublishCourse(course.id)),
          },
        ]
      : []),
    {
      key: "duplicate",
      label: "Dupliquer",
      icon: <Copy size={15} />,
      onClick: () =>
        run(async () => {
          const res = await duplicateCourse(course.id);
          if (res.ok) router.push(`/studio/courses/${res.courseId}/edit`);
          return res;
        }),
    },
    {
      key: "delete",
      label: "Supprimer",
      icon: <Trash2 size={15} />,
      danger: true,
      onClick: () => {
        setOpen(false);
        setConfirm("delete");
      },
    },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions pour « ${course.title} »`}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-navy/[0.1] bg-surface-primary text-text-secondary transition-colors hover:border-navy/20 hover:text-navy focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/30 disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-brand-blue-vif/40 text-brand-blue-royal",
        )}
      >
        <MoreVertical size={17} />
      </button>

      {/* Dropdown en portail */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && rect && (
              <motion.div
                ref={menuRef}
                role="menu"
                initial={{ opacity: 0, y: flip ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: flip ? 6 : -6, scale: 0.98 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "fixed",
                  right: Math.max(8, window.innerWidth - rect.right),
                  width: 232,
                  zIndex: 200,
                  ...(flip
                    ? { bottom: window.innerHeight - rect.top + 6 }
                    : { top: rect.bottom + 6 }),
                }}
                className="overflow-hidden rounded-xl border border-navy/[0.09] bg-surface-primary p-1 shadow-2xl"
              >
                {actions.map((a, i) => {
                  const isDangerSep = a.danger && i > 0;
                  const cls = cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    a.danger
                      ? "text-error hover:bg-error/[0.08]"
                      : "text-navy hover:bg-navy/[0.04]",
                  );
                  const inner = (
                    <>
                      <span className={a.danger ? "text-error" : "text-text-muted"}>
                        {a.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{a.label}</span>
                    </>
                  );
                  return (
                    <React.Fragment key={a.key}>
                      {isDangerSep && (
                        <div className="my-1 h-px bg-navy/[0.07]" aria-hidden />
                      )}
                      {a.href ? (
                        <Link
                          href={a.href}
                          role="menuitem"
                          target={a.external ? "_blank" : undefined}
                          rel={a.external ? "noopener noreferrer" : undefined}
                          onClick={() => setOpen(false)}
                          className={cls}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={a.onClick}
                          className={cls}
                        >
                          {inner}
                        </button>
                      )}
                    </React.Fragment>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Boîtes de confirmation (renvoi / suppression) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {confirm === "reject" && (
              <RejectDialog
                courseTitle={course.title}
                pending={pending}
                onClose={() => setConfirm(null)}
                onConfirm={(reason) => {
                  setConfirm(null);
                  run(() => rejectCourse({ courseId: course.id, reason }));
                }}
              />
            )}
            {confirm === "delete" && (
              <DeleteDialog
                courseTitle={course.title}
                enrollmentCount={course.enrollmentCount}
                pending={pending}
                onClose={() => setConfirm(null)}
                onConfirm={() => {
                  setConfirm(null);
                  run(() => deleteCourse(course.id));
                }}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/* ─────────────────────────── Renvoi avec motif ─────────────────────────────── */

function RejectDialog({
  courseTitle,
  pending,
  onClose,
  onConfirm,
}: {
  courseTitle: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string | undefined) => void;
}) {
  const [reason, setReason] = React.useState("");
  return (
    <Overlay onClose={onClose} label={`Renvoyer « ${courseTitle} »`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning/15 text-[#B45309]">
          <MessageSquareWarning size={19} />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Renvoyer le cours</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            « {courseTitle} » repassera en brouillon. Le motif est transmis à
            l&apos;instructeur.
          </p>
        </div>
      </div>
      <label className="mt-4 mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy">
        Motif du renvoi
      </label>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex : la description est trop courte, ajoutez au moins un chapitre vidéo, précisez les prérequis…"
        className="min-h-24 text-sm"
        maxLength={400}
        autoFocus
      />
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Annuler
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onConfirm(reason.trim() || undefined)}
          loading={pending}
          className="bg-error hover:bg-error/90"
        >
          <X size={15} /> Confirmer le renvoi
        </Button>
      </div>
    </Overlay>
  );
}

/* ─────────────────────────── Suppression ───────────────────────────────────── */

function DeleteDialog({
  courseTitle,
  enrollmentCount,
  pending,
  onClose,
  onConfirm,
}: {
  courseTitle: string;
  enrollmentCount: number;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Overlay onClose={onClose} label={`Supprimer « ${courseTitle} »`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-error/10 text-error">
          <Trash2 size={19} />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Supprimer ce cours ?</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            « {courseTitle} » sera archivé et retiré du catalogue.
            {enrollmentCount > 0
              ? ` ${enrollmentCount} inscription${enrollmentCount > 1 ? "s" : ""} existante${enrollmentCount > 1 ? "s" : ""} — cette action est réversible sous 30 jours.`
              : " Cette action est réversible sous 30 jours."}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Annuler
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onConfirm}
          loading={pending}
          className="bg-error hover:bg-error/90"
        >
          <Trash2 size={15} /> Supprimer
        </Button>
      </div>
    </Overlay>
  );
}

/* ─────────────────────────── Overlay commun ────────────────────────────────── */

function Overlay({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
}) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-navy/[0.07] bg-surface-primary p-6 shadow-2xl sm:rounded-2xl"
      >
        <div aria-hidden className="-mx-6 -mt-6 mb-5 h-1 bg-gradient-da" />
        {children}
      </motion.div>
    </motion.div>
  );
}
