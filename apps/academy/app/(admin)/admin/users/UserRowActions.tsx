"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  LogIn,
  MoreHorizontal,
  Power,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { Button, cn } from "@da/ui";
import { updateUserRoles, toggleUserActive, deleteUser } from "@/lib/admin-actions";
import { startImpersonation } from "@/lib/impersonation";
import { USER_ROLE } from "@/components/admin/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Menu d'actions par utilisateur — déclencheur discret « … » ouvrant un menu
   rendu en PORTAIL (jamais clippé par la carte / le tableau). Actions :
   · Se connecter en tant que (impersonation admin — confirmation, jamais soi-même)
   · Modifier les rôles (modale multi-sélection → updateUserRoles)
   · Activer / Désactiver le compte (toggleUserActive — confirmation)
   · Supprimer le compte (deleteUser — soft-delete, confirmation destructive)
   Chaque garde-fou renvoyé par le serveur est affiché en clair (feedback inline).
   ══════════════════════════════════════════════════════════════════════════ */

const ROLE_ORDER = ["LEARNER", "CLIENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] as const;

type DialogKind = "roles" | "impersonate" | "toggle" | "delete" | null;

export function UserRowActions({
  userId,
  name,
  email,
  roles,
  isActive,
  isSelf,
}: {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  isSelf: boolean;
}) {
  const [dialog, setDialog] = React.useState<DialogKind>(null);

  return (
    <>
      <ActionsMenu isSelf={isSelf} onSelect={setDialog} />

      <AnimatePresence>
        {dialog === "roles" && (
          <RolesDialog
            key="roles"
            name={name}
            userId={userId}
            currentRoles={roles}
            onClose={() => setDialog(null)}
          />
        )}
        {dialog === "impersonate" && (
          <ImpersonateDialog
            key="impersonate"
            name={name}
            email={email}
            userId={userId}
            onClose={() => setDialog(null)}
          />
        )}
        {dialog === "toggle" && (
          <ToggleActiveDialog
            key="toggle"
            name={name}
            userId={userId}
            isActive={isActive}
            onClose={() => setDialog(null)}
          />
        )}
        {dialog === "delete" && (
          <DeleteAccountDialog
            key="delete"
            name={name}
            email={email}
            userId={userId}
            onClose={() => setDialog(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ════════════════════════ Déclencheur + menu en portail ═════════════════════ */

function ActionsMenu({
  isSelf,
  onSelect,
}: {
  isSelf: boolean;
  onSelect: (k: DialogKind) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [flip, setFlip] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  const reposition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect(r);
    const spaceBelow = window.innerHeight - r.bottom;
    setFlip(spaceBelow < 220 && r.top > spaceBelow);
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

  function choose(kind: Exclude<DialogKind, null>) {
    setOpen(false);
    onSelect(kind);
  }

  const items: {
    kind: Exclude<DialogKind, null>;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    hint?: string;
    danger?: boolean;
  }[] = [
    {
      kind: "impersonate",
      icon: <LogIn size={16} />,
      label: "Se connecter en tant que",
      disabled: isSelf,
      hint: isSelf ? "C'est vous" : undefined,
    },
    { kind: "roles", icon: <UserCog size={16} />, label: "Modifier les rôles" },
    { kind: "toggle", icon: <Power size={16} />, label: "Activer / Désactiver" },
    // La suppression n'est jamais proposée sur sa propre ligne (le serveur
    // bloque aussi, mais on évite d'afficher une action forcément refusée).
    ...(isSelf
      ? []
      : [
          {
            kind: "delete" as const,
            icon: <Trash2 size={16} />,
            label: "Supprimer le compte",
            danger: true,
          },
        ]),
  ];

  return (
    <div className="relative">
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Actions sur cet utilisateur"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl border border-navy/[0.1] bg-surface-primary text-text-secondary transition-colors hover:border-navy/20 hover:text-navy",
          open && "border-brand-violet/40 text-brand-violet",
        )}
      >
        <MoreHorizontal size={18} />
      </motion.button>

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
                  right: Math.max(window.innerWidth - rect.right, 8),
                  width: 244,
                  zIndex: 200,
                  ...(flip
                    ? { bottom: window.innerHeight - rect.top + 6 }
                    : { top: rect.bottom + 6 }),
                }}
                className="overflow-hidden rounded-xl border border-navy/[0.09] bg-surface-primary p-1 shadow-2xl"
              >
                {items.map((it) => (
                  <button
                    key={it.kind}
                    type="button"
                    role="menuitem"
                    disabled={it.disabled}
                    onClick={() => choose(it.kind)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      it.disabled
                        ? "cursor-not-allowed text-text-muted"
                        : it.danger
                          ? "text-error hover:bg-error/[0.06]"
                          : "text-navy hover:bg-navy/[0.04]",
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0",
                        it.disabled
                          ? ""
                          : it.danger
                            ? "text-error"
                            : "text-brand-blue-royal",
                      )}
                    >
                      {it.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{it.label}</span>
                    {it.hint && (
                      <span className="shrink-0 text-xs text-text-muted">{it.hint}</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

/* ═══════════════════════════ Coque de modale partagée ═══════════════════════ */

function ModalShell({
  title,
  subtitle,
  icon,
  tone = "violet",
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: "violet" | "error";
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md rounded-t-2xl border border-navy/[0.07] bg-surface-primary shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-navy/[0.06] px-6 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white",
                tone === "error" ? "bg-error" : "bg-gradient-da",
              )}
            >
              {icon}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
              {subtitle && (
                <p className="truncate text-xs text-text-secondary">{subtitle}</p>
              )}
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
        <div className="flex flex-col gap-4 px-6 py-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════ Dialogue « se connecter en tant que » ═══════════ */

function ImpersonateDialog({
  name,
  email,
  userId,
  onClose,
}: {
  name: string;
  email: string;
  userId: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleConfirm() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      try {
        // Redirige côté serveur vers l'espace de l'utilisateur en cas de succès.
        await startImpersonation(userId);
      } catch {
        setError(
          "Impossible de prendre cette identité. Réessayez ou vérifiez vos droits.",
        );
      }
    });
  }

  return (
    <ModalShell
      title="Se connecter en tant que"
      subtitle={name}
      icon={<LogIn size={18} />}
      onClose={onClose}
    >
      <p className="text-sm text-text-secondary">
        Vous allez naviguer dans Academy avec l'identité de{" "}
        <span className="font-semibold text-navy">{name}</span>
        <span className="block truncate text-xs text-text-muted">{email}</span>
      </p>
      <div className="rounded-xl border border-brand-violet/20 bg-brand-violet/[0.05] px-4 py-3 text-xs text-text-secondary">
        Un bandeau vous permettra de revenir à votre compte administrateur à tout
        moment. Aucune action n'est effectuée en votre nom sur votre propre compte.
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
          onClick={handleConfirm}
          disabled={pending}
          whileHover={pending ? undefined : { scale: 1.02 }}
          whileTap={pending ? undefined : { scale: 0.97 }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogIn size={16} strokeWidth={2.5} />
          {pending ? "Ouverture…" : "Ouvrir son espace"}
        </motion.button>
      </div>
    </ModalShell>
  );
}

/* ═══════════════════════ Dialogue Activer / Désactiver ══════════════════════ */

function ToggleActiveDialog({
  name,
  userId,
  isActive,
  onClose,
}: {
  name: string;
  userId: string;
  isActive: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const next = !isActive; // état visé

  function handleConfirm() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await toggleUserActive(userId, next);
      if (!res.ok) {
        setError(res.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <ModalShell
      title={next ? "Réactiver le compte" : "Suspendre le compte"}
      subtitle={name}
      icon={<Power size={18} />}
      tone={next ? "violet" : "error"}
      onClose={onClose}
    >
      <p className="text-sm text-text-secondary">
        {next ? (
          <>
            <span className="font-semibold text-navy">{name}</span> pourra de nouveau se
            connecter et accéder à son espace.
          </>
        ) : (
          <>
            <span className="font-semibold text-navy">{name}</span> ne pourra plus se
            connecter tant que le compte reste suspendu. Ses données sont conservées.
          </>
        )}
      </p>

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
          onClick={handleConfirm}
          disabled={pending}
          whileHover={pending ? undefined : { scale: 1.02 }}
          whileTap={pending ? undefined : { scale: 0.97 }}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60",
            next ? "bg-gradient-da" : "bg-error hover:bg-error/90",
          )}
        >
          <Power size={16} strokeWidth={2.5} />
          {pending
            ? "En cours…"
            : next
              ? "Réactiver le compte"
              : "Suspendre le compte"}
        </motion.button>
      </div>
    </ModalShell>
  );
}

/* ═══════════════════════ Dialogue de suppression de compte ══════════════════ */

function DeleteAccountDialog({
  name,
  email,
  userId,
  onClose,
}: {
  name: string;
  email: string;
  userId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleConfirm() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteUser(userId);
      if (!res.ok) {
        // Garde-fous serveur : « pas soi-même », « seul un Super Admin… »,
        // « dernier Super Admin ». On garde la modale ouverte et on affiche
        // le message tel quel.
        setError(res.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <ModalShell
      title="Supprimer le compte"
      subtitle={name}
      icon={<Trash2 size={18} />}
      tone="error"
      onClose={onClose}
    >
      <p className="text-sm text-text-secondary">
        Vous êtes sur le point de supprimer le compte de{" "}
        <span className="font-semibold text-navy">{name}</span>.
        <span className="block truncate text-xs text-text-muted">{email}</span>
      </p>
      <div className="rounded-xl border border-error/20 bg-error/[0.05] px-4 py-3 text-xs text-text-secondary">
        Le compte sera désactivé et retiré de la liste. Cette suppression est un
        archivage : le compte reste{" "}
        <span className="font-semibold text-navy">récupérable pendant 30 jours</span>{" "}
        avant sa purge définitive.
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
          onClick={handleConfirm}
          disabled={pending}
          whileHover={pending ? undefined : { scale: 1.02 }}
          whileTap={pending ? undefined : { scale: 0.97 }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-error px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:bg-error/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 size={16} strokeWidth={2.5} />
          {pending ? "Suppression…" : "Supprimer le compte"}
        </motion.button>
      </div>
    </ModalShell>
  );
}

/* ══════════════════════════ Dialogue de gestion des rôles ═══════════════════ */

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
    <ModalShell
      title="Rôles"
      subtitle={name}
      icon={<ShieldCheck size={18} />}
      onClose={onClose}
    >
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
    </ModalShell>
  );
}
