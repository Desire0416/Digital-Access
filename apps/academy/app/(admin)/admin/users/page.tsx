import type { Metadata } from "next";
import Link from "next/link";
import {
  Flame,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UsersRound,
  Presentation,
} from "lucide-react";
import { Avatar, formatDate } from "@da/ui";
import { realUser } from "@da/auth/guards";
import { getAdminUsers } from "@/lib/admin-queries";
import {
  AdminPageHeader,
  AdminCard,
  StatCard,
  StatusPill,
  EmptyState,
  USER_ROLE,
  type Tone,
} from "@/components/admin/ui";
import { UserFilters, type UserFilterState } from "./UserFilters";
import { UserRowActions } from "./UserRowActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Utilisateurs",
  robots: { index: false, follow: false },
};

/* Rendu d'un jeu de pastilles de rôles (repris dans le tableau ET les cartes). */
function RoleTags({ roles }: { roles: string[] }) {
  if (roles.length === 0) {
    return <span className="text-xs italic text-text-muted">Aucun rôle</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => {
        const meta = USER_ROLE[role] ?? { label: role, tone: "slate" as Tone };
        return <StatusPill key={role} label={meta.label} tone={meta.tone} dot={false} />;
      })}
    </div>
  );
}

/* Statut : vérification email + activation du compte. */
function StatusTags({
  emailVerified,
  isActive,
}: {
  emailVerified: boolean;
  isActive: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <StatusPill
        label={emailVerified ? "Vérifié" : "Non vérifié"}
        tone={emailVerified ? "green" : "slate"}
      />
      <StatusPill
        label={isActive ? "Actif" : "Suspendu"}
        tone={isActive ? "green" : "red"}
      />
    </div>
  );
}

/* Activité : XP + streak, compact. */
function ActivityTags({ xp, streak }: { xp: number; streak: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-text-secondary">
      <span className="inline-flex items-center gap-1">
        <Sparkles size={13} className="text-accent" />
        {xp.toLocaleString("fr-FR")} XP
      </span>
      <span className="inline-flex items-center gap-1">
        <Flame size={13} className="text-warning" />
        {streak} j
      </span>
    </div>
  );
}

/* KPI cliquable → applique un filtre via l'URL (searchParams). */
function KpiLink({
  href,
  active,
  icon,
  label,
  value,
  tone,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      aria-label={`Filtrer : ${label}`}
      className={`block rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40 ${
        active ? "ring-2 ring-brand-violet/50" : ""
      }`}
    >
      <StatCard
        icon={icon}
        label={label}
        value={value.toLocaleString("fr-FR")}
        tone={tone}
      />
    </Link>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    verified?: string;
  }>;
}) {
  const sp = await searchParams;
  const filters: UserFilterState = {
    q: sp.q?.trim() ?? "",
    role: sp.role ?? "",
    status: sp.status ?? "",
    verified: sp.verified ?? "",
  };

  // La recherche texte est gérée par getAdminUsers ; les filtres rôle/statut/
  // email s'appliquent côté page sur la liste retournée.
  const [all, me] = await Promise.all([
    getAdminUsers(filters.q || undefined),
    realUser(),
  ]);

  // KPI calculés sur l'ensemble recherché (avant filtres à facettes).
  const stats = {
    total: all.length,
    learners: all.filter((u) => u.roles.includes("LEARNER")).length,
    instructors: all.filter((u) => u.roles.includes("INSTRUCTOR")).length,
    admins: all.filter(
      (u) => u.roles.includes("ADMIN") || u.roles.includes("SUPER_ADMIN"),
    ).length,
    unverified: all.filter((u) => !u.emailVerified).length,
  };

  // Filtrage combiné à facettes (rôle / statut compte / vérification email).
  const users = all.filter((u) => {
    if (filters.role) {
      if (filters.role === "ADMIN") {
        if (!u.roles.includes("ADMIN") && !u.roles.includes("SUPER_ADMIN"))
          return false;
      } else if (!u.roles.includes(filters.role)) {
        return false;
      }
    }
    if (filters.status === "active" && !u.isActive) return false;
    if (filters.status === "suspended" && u.isActive) return false;
    if (filters.verified === "yes" && !u.emailVerified) return false;
    if (filters.verified === "no" && u.emailVerified) return false;
    return true;
  });

  // Préserve les autres filtres actifs quand on clique un KPI.
  const kpiHref = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  const hasFacetFilter = !!filters.role || !!filters.status || !!filters.verified;

  return (
    <div>
      <AdminPageHeader
        title="Utilisateurs"
        description="Gérez les comptes de la plateforme Academy : recherchez, filtrez par rôle et statut, attribuez ou retirez des rôles, suspendez ou réactivez un accès, ou connectez-vous en tant qu'un utilisateur. Les 100 comptes les plus récents sont chargés."
      />

      {/* ── KPI cliquables (chaque carte pose un filtre) ─────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <KpiLink
          href={kpiHref({ role: "", status: "", verified: "" })}
          active={!hasFacetFilter}
          icon={<UsersRound size={18} />}
          label="Total"
          value={stats.total}
          tone="violet"
        />
        <KpiLink
          href={kpiHref({ role: "LEARNER" })}
          active={filters.role === "LEARNER"}
          icon={<GraduationCap size={18} />}
          label="Apprenants"
          value={stats.learners}
          tone="blue"
        />
        <KpiLink
          href={kpiHref({ role: "INSTRUCTOR" })}
          active={filters.role === "INSTRUCTOR"}
          icon={<Presentation size={18} />}
          label="Instructeurs"
          value={stats.instructors}
          tone="cyan"
        />
        <KpiLink
          href={kpiHref({ role: "ADMIN" })}
          active={filters.role === "ADMIN"}
          icon={<UserCheck size={18} />}
          label="Admins"
          value={stats.admins}
          tone="amber"
        />
        <KpiLink
          href={kpiHref({ verified: "no" })}
          active={filters.verified === "no"}
          icon={<ShieldAlert size={18} />}
          label="Non vérifiés"
          value={stats.unverified}
          tone="red"
        />
      </div>

      {/* ── Recherche avancée + filtres à facettes ──────────────────────────── */}
      <UserFilters filters={filters} resultCount={users.length} />

      {users.length === 0 ? (
        <EmptyState
          icon={<UsersRound size={22} />}
          title={
            filters.q || hasFacetFilter ? "Aucun résultat" : "Aucun utilisateur"
          }
          description={
            filters.q || hasFacetFilter
              ? "Aucun compte ne correspond à ces critères. Élargissez la recherche ou réinitialisez les filtres."
              : "Aucun compte n'est encore enregistré sur la plateforme."
          }
        />
      ) : (
        <>
          {/* ══════════ Desktop : tableau (≥ lg) ══════════ */}
          <AdminCard className="hidden lg:block" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-navy/[0.08] text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3.5 font-semibold">Utilisateur</th>
                    <th className="px-5 py-3.5 font-semibold">Rôles</th>
                    <th className="px-5 py-3.5 font-semibold">Statut</th>
                    <th className="px-5 py-3.5 font-semibold">Activité</th>
                    <th className="px-5 py-3.5 font-semibold">Inscrit le</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-surface-secondary/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} className="h-9 w-9 shrink-0" />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-semibold text-navy">
                              {u.name}
                              {me?.id === u.id && (
                                <span className="rounded-full bg-brand-violet/10 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-brand-violet">
                                  Vous
                                </span>
                              )}
                            </p>
                            <p className="max-w-[16rem] truncate text-xs text-text-secondary">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <RoleTags roles={u.roles} />
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <StatusTags emailVerified={u.emailVerified} isActive={u.isActive} />
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <ActivityTags xp={u.xp} streak={u.streak} />
                        <p className="mt-1 text-xs text-text-muted">
                          {u.enrollmentCount} inscription{u.enrollmentCount > 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-middle whitespace-nowrap text-xs text-text-secondary">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-4 align-middle text-right">
                        <div className="flex justify-end">
                          <UserRowActions
                            userId={u.id}
                            name={u.name}
                            email={u.email}
                            roles={u.roles}
                            isActive={u.isActive}
                            isSelf={me?.id === u.id}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>

          {/* ══════════ Mobile / tablette : cartes empilées (< lg) ══════════ */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {users.map((u) => (
              <article
                key={u.id}
                className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-lg sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.name} className="h-10 w-10 shrink-0" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-semibold text-navy">
                        {u.name}
                        {me?.id === u.id && (
                          <span className="shrink-0 rounded-full bg-brand-violet/10 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-brand-violet">
                            Vous
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-text-secondary">{u.email}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <UserRowActions
                      userId={u.id}
                      name={u.name}
                      email={u.email}
                      roles={u.roles}
                      isActive={u.isActive}
                      isSelf={me?.id === u.id}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3 border-t border-navy/[0.06] pt-4">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Rôles
                    </p>
                    <RoleTags roles={u.roles} />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Statut
                    </p>
                    <StatusTags emailVerified={u.emailVerified} isActive={u.isActive} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ActivityTags xp={u.xp} streak={u.streak} />
                    <span className="text-xs text-text-muted">
                      {u.enrollmentCount} inscription{u.enrollmentCount > 1 ? "s" : ""} ·
                      Inscrit le {formatDate(u.createdAt)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
