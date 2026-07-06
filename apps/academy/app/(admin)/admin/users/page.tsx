import type { Metadata } from "next";
import { Search, Flame, Sparkles, UsersRound } from "lucide-react";
import { Avatar, formatDate } from "@da/ui";
import { getAdminUsers } from "@/lib/admin-queries";
import {
  AdminPageHeader,
  AdminCard,
  StatusPill,
  EmptyState,
  USER_ROLE,
} from "@/components/admin/ui";
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
        const meta = USER_ROLE[role] ?? { label: role, tone: "slate" as const };
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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await getAdminUsers(q);

  return (
    <div>
      <AdminPageHeader
        title="Utilisateurs"
        description="Gérez les comptes de la plateforme Academy : attribuez ou retirez des rôles, suspendez ou réactivez un accès. Les 100 comptes les plus récents sont affichés — affinez avec la recherche."
      />

      {/* Recherche — formulaire GET, aucun JS requis. */}
      <form method="get" className="mb-6" role="search">
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Rechercher par nom ou email"
              aria-label="Rechercher par nom ou email"
              className="h-11 w-full rounded-lg border border-navy/15 bg-surface-primary pl-10 pr-3 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/25"
            />
          </div>
          <button
            type="submit"
            aria-label="Lancer la recherche"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-gradient-da px-4 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg"
          >
            <Search size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Rechercher</span>
          </button>
        </div>
      </form>

      {users.length === 0 ? (
        <EmptyState
          icon={<UsersRound size={22} />}
          title={q ? "Aucun résultat" : "Aucun utilisateur"}
          description={
            q
              ? `Aucun compte ne correspond à « ${q} ». Vérifiez l'orthographe ou élargissez la recherche.`
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
                            <p className="truncate font-semibold text-navy">{u.name}</p>
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
                        <UserRowActions
                          userId={u.id}
                          name={u.name}
                          roles={u.roles}
                          isActive={u.isActive}
                        />
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
                      <p className="truncate font-semibold text-navy">{u.name}</p>
                      <p className="truncate text-xs text-text-secondary">{u.email}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <UserRowActions
                      userId={u.id}
                      name={u.name}
                      roles={u.roles}
                      isActive={u.isActive}
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
