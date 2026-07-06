"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users2,
  Search,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  SlidersHorizontal,
  X,
  Check,
  Power,
  BadgeCheck,
  CircleSlash,
  Loader2,
} from "lucide-react";
import { cn, formatDate, Avatar } from "@da/ui";
import { EmptyState, StatusPill, type Tone } from "@/components/admin/ui";
import { Select, type SelectOption } from "@/components/Select";
import { updateUserRoles, toggleUserActive } from "@/lib/admin-actions";
import type { getAdminUsers } from "@/lib/admin-queries";

/* Type dérivé de la query — évite de dupliquer la forme. */
type AdminUser = Awaited<ReturnType<typeof getAdminUsers>>[number];

/* ──────────────────────────────── Rôles ────────────────────────────────── */

const ALL_ROLES = [
  "LEARNER",
  "CLIENT",
  "INSTRUCTOR",
  "ADMIN",
  "SUPER_ADMIN",
] as const;
type Role = (typeof ALL_ROLES)[number];

const ROLE_META: Record<Role, { label: string; tone: Tone; hint: string }> = {
  LEARNER: { label: "Apprenant", tone: "cyan", hint: "Accès Academy" },
  CLIENT: { label: "Client", tone: "blue", hint: "Portail projets & factures" },
  INSTRUCTOR: { label: "Instructeur", tone: "violet", hint: "Studio de cours" },
  ADMIN: { label: "Admin", tone: "amber", hint: "Back-office CRM" },
  SUPER_ADMIN: { label: "Super Admin", tone: "red", hint: "Contrôle total" },
};

/* Poids de tri des rôles pour un affichage cohérent (plus élevé d'abord). */
const ROLE_WEIGHT: Record<string, number> = {
  SUPER_ADMIN: 0,
  ADMIN: 1,
  INSTRUCTOR: 2,
  CLIENT: 3,
  LEARNER: 4,
};

/* Mappe un ton de statut vers un hex pour la pastille des Select. */
const TONE_HEX: Record<Tone, string> = {
  violet: "#5b3fa8",
  blue: "#2b5cc6",
  cyan: "#00bcd4",
  green: "#059669",
  amber: "#f59e0b",
  red: "#dc2626",
  slate: "#9ca3af",
};

/* Options du filtre par rôle (portail Select). */
const ROLE_FILTER_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "Tous les rôles" },
  ...ALL_ROLES.map((r) => ({
    value: r,
    label: ROLE_META[r].label,
    dotColor: TONE_HEX[ROLE_META[r].tone],
  })),
];

/* Options du filtre par statut de compte (portail Select). */
type StatusFilter = "ALL" | "VERIFIED" | "UNVERIFIED" | "ACTIVE" | "SUSPENDED";
const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "VERIFIED", label: "Vérifié", dotColor: TONE_HEX.green },
  { value: "UNVERIFIED", label: "Non vérifié", dotColor: TONE_HEX.slate },
  { value: "ACTIVE", label: "Actif", dotColor: TONE_HEX.green },
  { value: "SUSPENDED", label: "Suspendu", dotColor: TONE_HEX.red },
];

function sortRoles(roles: string[]): string[] {
  return [...roles].sort(
    (a, b) => (ROLE_WEIGHT[a] ?? 9) - (ROLE_WEIGHT[b] ?? 9),
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/* ═══════════════════════════════ Racine ════════════════════════════════ */

export function UsersTable({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = React.useState("");
  // Filtres par rôle et par statut de compte (valeur "ALL" = pas de filtre).
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  // Utilisateur en cours d'édition des rôles (modal).
  const [editing, setEditing] = React.useState<AdminUser | null>(null);
  // Erreur d'action éphémère (ex. rôle SUPER_ADMIN refusé, activation).
  const [error, setError] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      // Recherche texte : nom OU e-mail.
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      // Filtre par rôle.
      if (roleFilter !== "ALL" && !u.roles.includes(roleFilter)) {
        return false;
      }
      // Filtre par statut (vérifié / non vérifié / actif / suspendu).
      switch (statusFilter) {
        case "VERIFIED":
          if (!u.emailVerified) return false;
          break;
        case "UNVERIFIED":
          if (u.emailVerified) return false;
          break;
        case "ACTIVE":
          if (!u.isActive) return false;
          break;
        case "SUSPENDED":
          if (u.isActive) return false;
          break;
        default:
          break;
      }
      return true;
    });
  }, [users, query, roleFilter, statusFilter]);

  const hasActiveFilter =
    query.trim() !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<Users2 className="h-6 w-6" />}
        title="Aucun utilisateur"
        description="Les comptes créés depuis l'inscription publique ou l'espace admin apparaîtront ici."
      />
    );
  }

  return (
    <div>
      {/* Bandeau d'erreur global */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 flex items-start gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Fermer"
              className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-md text-error/70 transition-colors hover:bg-error/10 hover:text-error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre de filtres — recherche + rôle + statut (combinés en ET) */}
      <div className="mb-6 rounded-2xl border border-navy/[0.07] bg-surface-primary p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Recherche texte */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              aria-label="Rechercher un utilisateur"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom ou e-mail…"
              className="w-full rounded-xl border border-navy/[0.09] bg-surface-primary py-2.5 pl-9 pr-3 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-violet/40 focus:ring-2 focus:ring-brand-violet/20"
            />
          </div>

          {/* Filtres déroulants (portail) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center">
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              options={ROLE_FILTER_OPTIONS}
              ariaLabel="Filtrer par rôle"
              className="w-full sm:w-auto"
              buttonClassName="lg:min-w-[11rem]"
            />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              options={STATUS_FILTER_OPTIONS}
              ariaLabel="Filtrer par statut"
              className="w-full sm:w-auto"
              buttonClassName="lg:min-w-[11rem]"
            />
          </div>

          {/* Compteur + réinitialisation */}
          <div className="flex items-center justify-between gap-3 lg:ml-auto">
            <p className="text-xs font-semibold text-text-muted">
              {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}
              <span className="hidden text-text-muted/70 sm:inline">
                {" "}
                / {users.length}
              </span>
            </p>
            <AnimatePresence>
              {hasActiveFilter && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={resetFilters}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-navy/[0.09] px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand-violet/30 hover:bg-brand-violet/[0.06] hover:text-brand-violet"
                >
                  <X className="h-3.5 w-3.5" />
                  Réinitialiser
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Aucun résultat"
          description="Aucun utilisateur ne correspond à vos critères. Ajustez la recherche ou les filtres."
        />
      ) : (
        <>
          {/* ─── Mobile / tablette : cartes empilées (sous lg) ─── */}
          <motion.ul
            key={`cards-${query}-${roleFilter}-${statusFilter}`}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 lg:hidden"
          >
            {filtered.map((u) => (
              <motion.li key={u.id} variants={item}>
                <UserCard
                  user={u}
                  onEdit={() => setEditing(u)}
                  setError={setError}
                />
              </motion.li>
            ))}
          </motion.ul>

          {/* ─── Desktop : tableau (lg+) scrollable ─── */}
          <div className="hidden overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary lg:block">
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-navy/[0.07] bg-surface-secondary/50">
                    <Th>Utilisateur</Th>
                    <Th>Rôles</Th>
                    <Th>Statut</Th>
                    <Th>Contact</Th>
                    <Th>Inscrit le</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <motion.tbody
                  key={`rows-${query}-${roleFilter}-${statusFilter}`}
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {filtered.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      onEdit={() => setEditing(u)}
                      setError={setError}
                    />
                  ))}
                </motion.tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal d'édition des rôles */}
      <AnimatePresence>
        {editing && (
          <RoleEditor
            user={editing}
            onClose={() => setEditing(null)}
            setError={setError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── En-tête de tableau ────────────────────────── */

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

/* Pastilles de rôles (partagé desktop/mobile). */
function RoleBadges({ roles }: { roles: string[] }) {
  const sorted = sortRoles(roles);
  if (sorted.length === 0) {
    return (
      <span className="text-xs italic text-text-muted">Aucun rôle</span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {sorted.map((r) => {
        const meta = ROLE_META[r as Role];
        return (
          <StatusPill
            key={r}
            label={meta?.label ?? r}
            tone={meta?.tone ?? "slate"}
            dot={false}
          />
        );
      })}
    </span>
  );
}

/* Pastille statut compte (actif + vérifié). */
function AccountStatus({ user }: { user: AdminUser }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <StatusPill
        label={user.isActive ? "Actif" : "Désactivé"}
        tone={user.isActive ? "green" : "slate"}
      />
      {user.emailVerified ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
          <BadgeCheck className="h-3.5 w-3.5" />
          Vérifié
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted">
          <CircleSlash className="h-3.5 w-3.5" />
          Non vérifié
        </span>
      )}
    </span>
  );
}

/* ─────────────────────────── Ligne de tableau ──────────────────────────── */

function UserRow({
  user,
  onEdit,
  setError,
}: {
  user: AdminUser;
  onEdit: () => void;
  setError: (e: string | null) => void;
}) {
  return (
    <motion.tr
      variants={item}
      className="group border-b border-navy/[0.05] last:border-0 transition-colors hover:bg-surface-secondary/50"
    >
      {/* Utilisateur */}
      <td className="px-4 py-3.5 align-top">
        <span className="flex items-center gap-3">
          <Avatar
            name={user.name}
            src={user.avatar ?? undefined}
            className="h-9 w-9 shrink-0 text-xs"
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-bold text-navy">
              {user.name}
            </span>
            <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{user.email}</span>
            </span>
          </span>
        </span>
      </td>

      {/* Rôles */}
      <td className="px-4 py-3.5 align-top">
        <RoleBadges roles={user.roles} />
      </td>

      {/* Statut */}
      <td className="px-4 py-3.5 align-top">
        <AccountStatus user={user} />
      </td>

      {/* Contact */}
      <td className="px-4 py-3.5 align-top">
        <span className="flex flex-col gap-1 text-xs text-text-secondary">
          {user.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span className="truncate">{user.location}</span>
            </span>
          )}
          {user.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span className="truncate tabular-nums">{user.phone}</span>
            </span>
          )}
          {!user.location && !user.phone && (
            <span className="italic text-text-muted">—</span>
          )}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-3.5 align-top text-sm text-text-secondary">
        {formatDate(user.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 align-top">
        <span className="flex items-center justify-end gap-2">
          <ActiveToggle user={user} setError={setError} />
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/[0.09] bg-surface-primary px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-violet/30 hover:bg-brand-violet/[0.06] hover:text-brand-violet"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Rôles
          </button>
        </span>
      </td>
    </motion.tr>
  );
}

/* ──────────────────────────── Carte mobile ─────────────────────────────── */

function UserCard({
  user,
  onEdit,
  setError,
}: {
  user: AdminUser;
  onEdit: () => void;
  setError: (e: string | null) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-lg"
    >
      {/* Filet dégradé signature en tête de carte */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-da opacity-70"
      />

      <div className="flex items-start gap-3">
        <Avatar
          name={user.name}
          src={user.avatar ?? undefined}
          className="h-11 w-11 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-bold text-navy">
            {user.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{user.email}</span>
          </p>
        </div>
      </div>

      {/* Statut */}
      <div className="mt-3">
        <AccountStatus user={user} />
      </div>

      {/* Rôles */}
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Rôles
        </p>
        <RoleBadges roles={user.roles} />
      </div>

      {/* Contact + date */}
      <div className="mt-3 flex flex-col gap-1.5 border-t border-navy/[0.06] pt-3 text-xs text-text-secondary">
        {user.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            <span className="truncate">{user.location}</span>
          </span>
        )}
        {user.phone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            <span className="truncate tabular-nums">{user.phone}</span>
          </span>
        )}
        <span className="flex items-center gap-1.5 text-text-muted">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          Inscrit le {formatDate(user.createdAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-navy/[0.09] bg-surface-primary px-3 py-2 text-xs font-semibold text-navy transition-colors hover:border-brand-violet/30 hover:bg-brand-violet/[0.06] hover:text-brand-violet"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Modifier les rôles
        </button>
        <ActiveToggle user={user} setError={setError} />
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Bouton activer / désactiver ───────────────────── */

function ActiveToggle({
  user,
  setError,
}: {
  user: AdminUser;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const next = !user.isActive;

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      const res = await toggleUserActive({ id: user.id, isActive: next });
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={next ? "Activer le compte" : "Désactiver le compte"}
      title={next ? "Activer le compte" : "Désactiver le compte"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
        user.isActive
          ? "border-error/20 text-error hover:bg-error/[0.07]"
          : "border-success/25 text-success hover:bg-success/[0.08]",
      )}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Power className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">
        {user.isActive ? "Désactiver" : "Activer"}
      </span>
    </button>
  );
}

/* ───────────────────────── Modal d'édition des rôles ───────────────────── */

function RoleEditor({
  user,
  onClose,
  setError,
}: {
  user: AdminUser;
  onClose: () => void;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(user.roles),
  );

  // Verrou du défilement d'arrière-plan + fermeture au clavier (Échap).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, pending]);

  const toggleRole = (role: Role) => {
    setLocalError(null);
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(role)) nextSet.delete(role);
      else nextSet.add(role);
      return nextSet;
    });
  };

  const currentSorted = sortRoles(user.roles).join("|");
  const selectedSorted = sortRoles([...selected]).join("|");
  const dirty = currentSorted !== selectedSorted;
  const empty = selected.size === 0;

  const save = () => {
    if (empty) {
      setLocalError("Sélectionnez au moins un rôle.");
      return;
    }
    setLocalError(null);
    startTransition(async () => {
      const res = await updateUserRoles({
        id: user.id,
        roles: [...selected],
      });
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        // Erreur métier (ex. attribution de SUPER_ADMIN refusée).
        setLocalError(res.error);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => {
        if (!pending) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Modifier les rôles de ${user.name}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-surface-primary shadow-xl sm:rounded-2xl"
      >
        {/* En-tête dégradé signature */}
        <div className="relative bg-gradient-da px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <Avatar
              name={user.name}
              src={user.avatar ?? undefined}
              className="h-11 w-11 shrink-0 border-2 border-white/30 bg-white/15"
            />
            <div className="min-w-0">
              <h2 className="truncate font-display text-base font-bold">
                {user.name}
              </h2>
              <p className="truncate text-xs text-white/80">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !pending && onClose()}
            aria-label="Fermer"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corps : sélection des rôles */}
        <div className="px-5 py-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
            <ShieldCheck className="h-4 w-4 text-brand-violet" />
            Rôles attribués
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Sélectionnez un ou plusieurs rôles. Les permissions cumulent l'accès
            de chaque rôle.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {ALL_ROLES.map((role) => {
              const meta = ROLE_META[role];
              const checked = selected.has(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  disabled={pending}
                  aria-pressed={checked}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all disabled:opacity-60",
                    checked
                      ? "border-brand-violet/40 bg-brand-violet/[0.06]"
                      : "border-navy/[0.09] bg-surface-primary hover:border-navy/20 hover:bg-surface-secondary/60",
                  )}
                >
                  {/* Case cochée brandée */}
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                      checked
                        ? "border-transparent bg-gradient-da text-white"
                        : "border-navy/20 bg-surface-primary",
                    )}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-navy">
                        {meta.label}
                      </span>
                      <StatusPill label={role} tone={meta.tone} dot={false} />
                    </span>
                    <span className="mt-0.5 block text-xs text-text-secondary">
                      {meta.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Erreur d'action (ex. SUPER_ADMIN refusé) */}
          <AnimatePresence>
            {localError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 flex items-start gap-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs font-medium text-error"
              >
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {localError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Pied : actions */}
        <div className="flex items-center justify-end gap-3 border-t border-navy/[0.07] bg-surface-secondary/40 px-5 py-4">
          <button
            type="button"
            onClick={() => !pending && onClose()}
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-navy/[0.05] hover:text-navy disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty || empty}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white shadow-brand transition-all",
              "hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
            )}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
