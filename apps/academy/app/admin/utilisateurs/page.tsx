import { Search, Users, ShieldCheck, MailCheck, MailX, X } from "lucide-react";
import { getAdminUsers } from "@/lib/admin-queries";
import { AdminPageHeader, AdminCard, EmptyState, StatusPill, type Tone } from "@/components/admin/ui";
import { UserRowActions } from "@/components/admin/UserRowActions";
import { ROLE_LABEL, ROLE_PRIORITY, type Role } from "@/lib/roles";
import { cn } from "@da/ui";

export const dynamic = "force-dynamic";

/* ══════════════════════════════════════════════════════════════════════════
   Back-office · Utilisateurs — annuaire des comptes de la plateforme.
   Recherche server-side (formulaire GET, aucun JS requis) ; gestion des rôles,
   activation et impersonation déléguées au composant client de chaque ligne.
   ══════════════════════════════════════════════════════════════════════════ */

/** Teinte de chaque rôle pour les pastilles (les 9 rôles de ROLE_PRIORITY). */
const ROLE_TONE: Record<Role, Tone> = {
  SUPER_ADMIN: "red",
  ADMIN: "amber",
  ACADEMIC_MANAGER: "violet",
  INSTRUCTOR: "violet",
  REVIEWER: "blue",
  MENTOR: "cyan",
  COMPANY: "blue",
  CLIENT: "cyan",
  LEARNER: "slate",
};

function roleLabel(role: string): string {
  return ROLE_LABEL[role as Role] ?? role;
}

function roleTone(role: string): Tone {
  return ROLE_TONE[role as Role] ?? "slate";
}

/** Rôles triés par priorité décroissante pour un affichage cohérent. */
function sortRoles(roles: string[]): string[] {
  return [...roles].sort(
    (a, b) => ROLE_PRIORITY.indexOf(a as Role) - ROLE_PRIORITY.indexOf(b as Role),
  );
}

function RoleChips({ roles }: { roles: string[] }) {
  if (roles.length === 0) {
    return <span className="text-xs text-text-muted">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {sortRoles(roles).map((r) => (
        <StatusPill key={r} label={roleLabel(r)} tone={roleTone(r)} dot={false} />
      ))}
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const users = await getAdminUsers(query || undefined);

  return (
    <>
      <AdminPageHeader
        title="Utilisateurs"
        description="Annuaire des comptes — pilotez les rôles, l'activation et prenez l'identité d'un utilisateur pour diagnostiquer son espace."
      >
        <span className="rounded-full bg-navy/[0.06] px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {users.length} {users.length > 1 ? "comptes" : "compte"}
        </span>
      </AdminPageHeader>

      {/* Barre de recherche — formulaire GET (pas de client) */}
      <form method="get" className="mb-6">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Rechercher par nom ou email…"
              aria-label="Rechercher un utilisateur"
              className="w-full rounded-xl border border-navy/[0.1] bg-surface-primary py-2.5 pl-10 pr-4 text-sm text-navy shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Search size={15} />
              Rechercher
            </button>
            {query && (
              <a
                href="/admin/utilisateurs"
                className="inline-flex items-center gap-1.5 rounded-xl border border-navy/10 px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-navy/20 hover:text-navy"
              >
                <X size={15} />
                Effacer
              </a>
            )}
          </div>
        </div>
      </form>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title={query ? "Aucun résultat" : "Aucun utilisateur"}
          description={
            query
              ? `Aucun compte ne correspond à « ${query} ». Vérifiez l'orthographe ou effacez la recherche.`
              : "Les comptes créés sur la plateforme apparaîtront ici."
          }
        />
      ) : (
        <AdminCard bodyClassName="p-0">
          {/* Tablette & desktop : tableau */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy/[0.08] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3.5">Utilisateur</th>
                  <th className="px-4 py-3.5">Rôles</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5 text-center">Inscriptions</th>
                  <th className="px-4 py-3.5">Inscrit le</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-navy/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy">{u.name}</p>
                          <p className="truncate text-xs text-text-secondary">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RoleChips roles={u.roles} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadges isActive={u.isActive} emailVerified={u.emailVerified} />
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-navy">
                      {u.enrollmentCount}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-text-secondary">
                      {fmtDate(u.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <UserRowActions
                          user={{ id: u.id, name: u.name, roles: u.roles, isActive: u.isActive }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & tablette étroite : cartes empilées */}
          <ul className="divide-y divide-navy/[0.06] lg:hidden">
            {users.map((u) => (
              <li key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.name} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{u.name}</p>
                      <p className="truncate text-xs text-text-secondary">{u.email}</p>
                    </div>
                  </div>
                  <UserRowActions
                    user={{ id: u.id, name: u.name, roles: u.roles, isActive: u.isActive }}
                  />
                </div>

                <div className="mt-3">
                  <RoleChips roles={u.roles} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <StatusBadges isActive={u.isActive} emailVerified={u.emailVerified} />
                  <span className="text-xs text-text-secondary">
                    {u.enrollmentCount} inscription{u.enrollmentCount > 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-text-muted">Inscrit le {fmtDate(u.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </>
  );
}

/* ── Sous-composants d'affichage ─────────────────────────────────────────── */

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-da text-xs font-bold text-white"
    >
      {initials || "?"}
    </span>
  );
}

function StatusBadges({
  isActive,
  emailVerified,
}: {
  isActive: boolean;
  emailVerified: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
          isActive ? "bg-success/10 text-success" : "bg-navy/[0.06] text-text-secondary",
        )}
      >
        <ShieldCheck size={12} />
        {isActive ? "Actif" : "Inactif"}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
          emailVerified ? "bg-brand-blue-royal/10 text-brand-blue-royal" : "bg-warning/15 text-[#B45309]",
        )}
      >
        {emailVerified ? <MailCheck size={12} /> : <MailX size={12} />}
        {emailVerified ? "Email vérifié" : "Non vérifié"}
      </span>
    </div>
  );
}
