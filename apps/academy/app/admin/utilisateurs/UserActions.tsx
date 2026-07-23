"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Power, Loader2, Check, X, ShieldAlert, UserCog, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@da/ui";
import { setUserRoles, toggleUserActive, deleteUser, restoreUser } from "@/lib/admin-actions";
import { startImpersonation } from "@/lib/impersonation-actions";
import type { Role } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Actions par utilisateur (rôles + activation). Client léger : appelle les
   Server Actions gardées par requireAdminFresh(). La protection SUPER_ADMIN
   est appliquée EN BASE ; l'UI la reflète pour éviter les faux espoirs.
   ══════════════════════════════════════════════════════════════════════════ */

export const ALL_ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "LEARNER", label: "Apprenant", hint: "Accès à l'espace d'apprentissage" },
  { value: "INSTRUCTOR", label: "Formateur", hint: "Création et animation de formations" },
  { value: "GRADER", label: "Correcteur", hint: "Correction des projets soumis" },
  { value: "MENTOR", label: "Mentor", hint: "Tutorat et accompagnement" },
  { value: "SCHOOL_MANAGER", label: "Resp. d'école", hint: "Gestion d'une école" },
  { value: "PATH_MANAGER", label: "Resp. de parcours", hint: "Gestion des parcours métiers" },
  { value: "ORG_MANAGER", label: "Resp. entreprise", hint: "Espace entreprise" },
  { value: "ACADEMIC_ADMIN", label: "Admin pédagogique", hint: "Back-office pédagogique" },
  { value: "SALES_ADMIN", label: "Admin commercial", hint: "Back-office commercial" },
  { value: "SUPER_ADMIN", label: "Super administrateur", hint: "Contrôle total — réservé" },
];

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cn("mt-2 text-xs font-medium", msg.ok ? "text-success" : "text-error")}
        >
          {msg.text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function UserActions({
  user,
  actorIsSuper,
  isSelf,
}: {
  user: { id: string; name: string; roles: Role[]; isActive: boolean; isDeleted?: boolean };
  actorIsSuper: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Role[]>(user.roles);
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const targetIsSuper = user.roles.includes("SUPER_ADMIN");
  const isDeleted = !!user.isDeleted;
  // Un non-super ne peut pas gérer un super admin ni octroyer le rôle super.
  const lockedTarget = targetIsSuper && !actorIsSuper;
  // Impersonation / suppression : super admin uniquement, jamais soi-même.
  const canImpersonate = actorIsSuper && !isSelf && !isDeleted;
  const canDelete = actorIsSuper && !isSelf && !targetIsSuper && !isDeleted;

  React.useEffect(() => {
    if (open) {
      setSelected(user.roles);
      setMsg(null);
    }
  }, [open, user.roles]);

  function toggleRole(role: Role) {
    if (role === "SUPER_ADMIN" && !actorIsSuper) return;
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function saveRoles() {
    if (selected.length === 0) {
      setMsg({ ok: false, text: "Au moins un rôle est requis." });
      return;
    }
    startTransition(async () => {
      const res = await setUserRoles(user.id, selected);
      if (res.ok) {
        setMsg({ ok: true, text: res.message ?? "Rôles mis à jour." });
        setTimeout(() => setOpen(false), 700);
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  function toggleActive() {
    startTransition(async () => {
      const res = await toggleUserActive(user.id);
      setMsg(res.ok ? { ok: true, text: res.message ?? "Mis à jour." } : { ok: false, text: res.error });
    });
  }

  function impersonate() {
    startTransition(async () => {
      const res = await startImpersonation(user.id);
      if (res.ok) router.push("/");
      else setMsg({ ok: false, text: res.error });
    });
  }

  function remove() {
    if (!window.confirm(`Supprimer le compte de ${user.name} ? Il ne pourra plus se connecter (récupérable pendant la période de rétention).`)) return;
    startTransition(async () => {
      const res = await deleteUser(user.id);
      setMsg(res.ok ? { ok: true, text: res.message ?? "Compte supprimé." } : { ok: false, text: res.error });
    });
  }

  function restore() {
    startTransition(async () => {
      const res = await restoreUser(user.id);
      setMsg(res.ok ? { ok: true, text: res.message ?? "Compte restauré." } : { ok: false, text: res.error });
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={lockedTarget}
        title={lockedTarget ? "Réservé à un super administrateur" : "Modifier les rôles"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal",
          lockedTarget && "cursor-not-allowed opacity-40 hover:border-navy/10 hover:text-navy",
        )}
      >
        <SlidersHorizontal size={13} />
        Rôles
      </button>

      <button
        type="button"
        onClick={toggleActive}
        disabled={pending || isSelf || lockedTarget}
        title={isSelf ? "Vous ne pouvez pas modifier votre propre compte" : user.isActive ? "Désactiver" : "Réactiver"}
        className={cn(
          "inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border transition-colors",
          user.isActive
            ? "border-error/20 text-error hover:bg-error/[0.06]"
            : "border-success/20 text-success hover:bg-success/[0.06]",
          (pending || isSelf || lockedTarget) && "cursor-not-allowed opacity-40",
        )}
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
      </button>

      {/* Se connecter en tant que (impersonation) — super admin */}
      {canImpersonate && (
        <button
          type="button"
          onClick={impersonate}
          disabled={pending}
          title={`Se connecter en tant que ${user.name}`}
          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-navy/10 text-brand-blue-royal transition-colors hover:border-brand-blue-vif/40 hover:bg-brand-blue-vif/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <UserCog size={14} />
        </button>
      )}

      {/* Supprimer / Restaurer le compte — super admin */}
      {isDeleted && actorIsSuper ? (
        <button
          type="button"
          onClick={restore}
          disabled={pending}
          title="Restaurer le compte"
          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-success/20 text-success transition-colors hover:bg-success/[0.06] disabled:opacity-40"
        >
          <RotateCcw size={14} />
        </button>
      ) : canDelete ? (
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          title={`Supprimer le compte de ${user.name}`}
          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-error/20 text-error transition-colors hover:bg-error/[0.06] disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      ) : null}

      {/* Modale d'édition des rôles */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 z-[60] bg-navy/50 backdrop-blur-sm"
                />
                <div className="fixed inset-0 z-[61] grid place-items-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.18 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Rôles de ${user.name}`}
                    className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-primary shadow-2xl"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-navy/[0.07] bg-surface-secondary/60 px-5 py-4">
                      <div>
                        <p className="font-display text-base font-bold text-navy">Rôles de l'utilisateur</p>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">{user.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Fermer"
                        className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="max-h-[55vh] space-y-1.5 overflow-y-auto p-3">
                      {ALL_ROLES.map((r) => {
                        const checked = selected.includes(r.value);
                        const disabled = r.value === "SUPER_ADMIN" && !actorIsSuper;
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => toggleRole(r.value)}
                            disabled={disabled}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                              checked
                                ? "border-brand-blue-vif/40 bg-brand-blue-vif/[0.06]"
                                : "border-navy/[0.08] hover:bg-navy/[0.03]",
                              disabled && "cursor-not-allowed opacity-40",
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                                checked ? "border-transparent bg-gradient-da text-white" : "border-navy/20",
                              )}
                            >
                              {checked && <Check size={13} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                                {r.label}
                                {r.value === "SUPER_ADMIN" && <ShieldAlert size={13} className="text-accent" />}
                              </span>
                              <span className="block truncate text-xs text-text-muted">{r.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                      <Feedback msg={msg} />
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-navy/[0.07] px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-navy/[0.05]"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={saveRoles}
                        disabled={pending}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
                      >
                        {pending && <Loader2 size={14} className="animate-spin" />}
                        Enregistrer
                      </button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
