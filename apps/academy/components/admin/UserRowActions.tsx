"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  Loader2,
  Check,
  ShieldCheck,
  ShieldOff,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { cn } from "@da/ui";
import { ROLE_LABEL, ROLE_PRIORITY, type Role } from "@/lib/roles";
import { setUserRoles, toggleUserActive } from "@/lib/admin-actions";
import { startImpersonation } from "@/lib/impersonation";

/* ══════════════════════════════════════════════════════════════════════════
   Gestion d'un compte utilisateur (fenêtre modale via portail) :
   · édition des rôles (cases à cocher des 9 rôles de ROLE_PRIORITY → setUserRoles),
   · activation / désactivation (toggleUserActive),
   · « Se connecter en tant que » (startImpersonation → redirige).
   Toutes les mutations passent par useTransition ; les erreurs serveur (ex.
   « Vous ne pouvez pas modifier vos propres rôles ») s'affichent sous les actions.
   ══════════════════════════════════════════════════════════════════════════ */

type ManagedUser = {
  id: string;
  name: string;
  roles: string[];
  isActive: boolean;
};

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

export function UserRowActions({ user }: { user: ManagedUser }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const [roles, setRoles] = React.useState<string[]>(user.roles);
  const [active, setActive] = React.useState(user.isActive);
  const [pending, startTransition] = React.useTransition();
  const [busy, setBusy] = React.useState<"roles" | "active" | "impersonate" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

  // Resynchronise l'état local sur les props (après router.refresh).
  React.useEffect(() => setRoles(user.roles), [user.roles]);
  React.useEffect(() => setActive(user.isActive), [user.isActive]);

  // Réinitialise à l'ouverture pour repartir de l'état serveur courant.
  React.useEffect(() => {
    if (open) {
      setRoles(user.roles);
      setActive(user.isActive);
      setError(null);
    }
  }, [open, user.roles, user.isActive]);

  // Verrouille le défilement de fond + fermeture au clavier.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !pending && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, pending]);

  const rolesChanged = !sameSet(roles, user.roles);

  function toggleRole(role: string) {
    setError(null);
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function saveRoles() {
    if (pending || !rolesChanged || roles.length === 0) return;
    setError(null);
    setBusy("roles");
    startTransition(async () => {
      const res = await setUserRoles(user.id, roles);
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      setOpen(false);
    });
  }

  function toggleActive() {
    if (pending) return;
    const next = !active;
    setError(null);
    setBusy("active");
    startTransition(async () => {
      const res = await toggleUserActive(user.id, next);
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setActive(next);
      router.refresh();
    });
  }

  function impersonate() {
    if (pending) return;
    setError(null);
    setBusy("impersonate");
    // startImpersonation redirige côté serveur (pas de valeur de retour).
    startTransition(() => {
      void startImpersonation(user.id);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal"
        aria-haspopup="dialog"
      >
        <SlidersHorizontal size={13} />
        Gérer
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Fond */}
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => !pending && setOpen(false)}
                  className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
                />

                {/* Panneau */}
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Gérer ${user.name}`}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-navy/[0.08] bg-surface-primary shadow-2xl sm:rounded-2xl"
                >
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-3 border-b border-navy/[0.06] px-5 py-4">
                    <div className="min-w-0">
                      <h2 className="font-display text-base font-bold text-navy">Gérer le compte</h2>
                      <p className="mt-0.5 truncate text-sm text-text-secondary">{user.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !pending && setOpen(false)}
                      disabled={pending}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy disabled:opacity-50"
                      aria-label="Fermer"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
                    {/* Rôles */}
                    <section>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                          Rôles
                        </h3>
                        {roles.length === 0 && (
                          <span className="text-[11px] font-medium text-error">
                            Sélectionnez au moins un rôle
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {ROLE_PRIORITY.map((role) => {
                          const checked = roles.includes(role);
                          return (
                            <label
                              key={role}
                              className={cn(
                                "flex cursor-pointer select-none items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors",
                                checked
                                  ? "border-brand-blue-vif/40 bg-brand-blue-royal/[0.06] text-navy"
                                  : "border-navy/10 text-text-secondary hover:border-navy/20 hover:bg-navy/[0.02]",
                              )}
                            >
                              <span
                                className={cn(
                                  "grid h-[1.125rem] w-[1.125rem] shrink-0 place-items-center rounded-md border transition-colors",
                                  checked
                                    ? "border-transparent bg-gradient-da text-white"
                                    : "border-navy/25 bg-surface-primary",
                                )}
                              >
                                {checked && <Check size={12} strokeWidth={3} />}
                              </span>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                onChange={() => toggleRole(role)}
                                disabled={pending}
                              />
                              <span className="font-medium leading-tight">
                                {ROLE_LABEL[role as Role]}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={saveRoles}
                        disabled={pending || !rolesChanged || roles.length === 0}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy === "roles" ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Check size={15} />
                        )}
                        Enregistrer les rôles
                      </button>
                    </section>

                    <div className="my-5 h-px bg-navy/[0.06]" />

                    {/* Activation & impersonation */}
                    <section className="space-y-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Actions
                      </h3>

                      <button
                        type="button"
                        onClick={toggleActive}
                        disabled={pending}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          active
                            ? "border-error/25 text-error hover:bg-error/[0.05]"
                            : "border-success/25 text-success hover:bg-success/[0.05]",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          {busy === "active" ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : active ? (
                            <ShieldOff size={16} />
                          ) : (
                            <ShieldCheck size={16} />
                          )}
                          {active ? "Désactiver le compte" : "Activer le compte"}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            active ? "bg-success/10 text-success" : "bg-navy/[0.06] text-text-secondary",
                          )}
                        >
                          {active ? "Actif" : "Inactif"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={impersonate}
                        disabled={pending}
                        className="flex w-full items-center gap-2.5 rounded-xl border border-navy/10 px-3.5 py-3 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy === "impersonate" ? (
                          <Loader2 size={16} className="animate-spin text-brand-blue-royal" />
                        ) : (
                          <LogIn size={16} className="text-brand-blue-royal" />
                        )}
                        Se connecter en tant que cet utilisateur
                      </button>
                    </section>

                    {error && (
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-error/20 bg-error/[0.05] px-3.5 py-2.5 text-sm text-error">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
