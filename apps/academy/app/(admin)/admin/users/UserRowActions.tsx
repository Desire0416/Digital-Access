"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Power, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { Button, cn } from "@da/ui";
import { updateUserRoles, toggleUserActive } from "@/lib/admin-actions";
import { USER_ROLE } from "@/components/admin/ui";

/* Ordre d'affichage stable des rôles dans le sélecteur. */
const ROLE_ORDER = ["LEARNER", "CLIENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] as const;

export function UserRowActions({
  userId,
  name,
  roles,
  isActive,
}: {
  userId: string;
  name: string;
  roles: string[];
  isActive: boolean;
}) {
  const router = useRouter();
  const [managing, setManaging] = React.useState(false);
  const [togglePending, startToggle] = React.useTransition();
  const [toggleError, setToggleError] = React.useState<string | null>(null);

  function handleToggleActive() {
    setToggleError(null);
    startToggle(async () => {
      const res = await toggleUserActive(userId, !isActive);
      if (!res.ok) setToggleError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {/* Suspendre / Réactiver */}
        <motion.button
          type="button"
          onClick={handleToggleActive}
          disabled={togglePending}
          whileHover={togglePending ? undefined : { scale: 1.03 }}
          whileTap={togglePending ? undefined : { scale: 0.95 }}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            isActive
              ? "border-error/30 text-error hover:bg-error/10"
              : "border-success/30 text-success hover:bg-success/10",
          )}
        >
          <Power size={14} strokeWidth={2.5} />
          {togglePending ? "…" : isActive ? "Suspendre" : "Réactiver"}
        </motion.button>

        {/* Gérer les rôles */}
        <motion.button
          type="button"
          onClick={() => setManaging(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-da px-3 text-xs font-semibold text-white shadow-sm transition-shadow hover:shadow-lg"
        >
          <SlidersHorizontal size={14} strokeWidth={2.5} />
          Gérer
        </motion.button>
      </div>

      {toggleError && (
        <p className="max-w-[15rem] text-right text-xs font-medium text-error">
          {toggleError}
        </p>
      )}

      <AnimatePresence>
        {managing && (
          <RolesDialog
            name={name}
            userId={userId}
            currentRoles={roles}
            onClose={() => setManaging(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════ Dialogue de gestion des rôles ═══════════════════════ */

function RolesDialog({
  name,
  userId,
  currentRoles,
  onClose,
}: {
  name: string;
  userId: string;
  currentRoles: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string[]>(currentRoles);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Fermeture à la touche Échap.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleRole(role: string) {
    setError(null);
    setSelected((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function handleSave() {
    if (pending) return;
    setError(null);
    if (selected.length === 0) {
      setError("Sélectionnez au moins un rôle.");
      return;
    }
    startTransition(async () => {
      const res = await updateUserRoles(userId, { roles: selected });
      if (!res.ok) {
        setError(res.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Gérer les rôles de ${name}`}
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md rounded-t-2xl border border-navy/[0.07] bg-surface-primary shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-navy/[0.06] px-6 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-da text-white">
              <ShieldCheck size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-navy">Rôles</h2>
              <p className="truncate text-xs text-text-secondary">{name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-navy/[0.06] hover:text-navy"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-col gap-3 px-6 py-5">
          <p className="text-sm text-text-secondary">
            Cochez les rôles à attribuer à cet utilisateur. Chaque rôle débloque une
            navigation et des permissions distinctes.
          </p>

          <div className="flex flex-col gap-2">
            {ROLE_ORDER.map((role) => {
              const meta = USER_ROLE[role];
              const checked = selected.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  aria-pressed={checked}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    checked
                      ? "border-brand-violet/40 bg-brand-violet/[0.06]"
                      : "border-navy/[0.08] hover:border-navy/20 hover:bg-surface-secondary/70",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                      checked
                        ? "border-transparent bg-gradient-da text-white"
                        : "border-navy/25 bg-surface-primary",
                    )}
                  >
                    {checked && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-sm font-semibold"
                      style={{ color: checked ? "#1A1A2E" : undefined }}
                    >
                      {meta.label}
                    </span>
                    <span className="block font-mono text-[0.7rem] text-text-muted">
                      {role}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-error/10 px-3 py-2.5 text-sm font-medium text-error"
            >
              {error}
            </p>
          )}

          <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Annuler
            </Button>
            <motion.button
              type="button"
              onClick={handleSave}
              disabled={pending}
              whileHover={pending ? undefined : { scale: 1.02 }}
              whileTap={pending ? undefined : { scale: 0.97 }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
