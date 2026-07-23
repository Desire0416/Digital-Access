import type { Metadata } from "next";
import { Search, Users } from "lucide-react";
import { Avatar } from "@da/ui";
import type { Role } from "@da/academy-db/client";
import { listUsersAdmin, listCoursesForPicker } from "@/lib/admin-queries";
import { currentUser } from "@/lib/guards";
import { AdminPageHeader, AdminCard, StatusPill, AdminEmpty } from "@/components/admin/ui";
import { UserActions } from "./UserActions";
import { ViewAsRole } from "./ViewAsRole";

export const metadata: Metadata = { title: "Utilisateurs — Administration" };

const ROLE_LABEL: Record<string, string> = {
  LEARNER: "Apprenant",
  INSTRUCTOR: "Formateur",
  GRADER: "Correcteur",
  MENTOR: "Mentor",
  SCHOOL_MANAGER: "Resp. école",
  PATH_MANAGER: "Resp. parcours",
  ORG_MANAGER: "Resp. entreprise",
  ACADEMIC_ADMIN: "Admin pédago.",
  SALES_ADMIN: "Admin commercial",
  SUPER_ADMIN: "Super admin",
};

const ADMIN_ROLES = new Set(["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"]);

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "LEARNER", label: "Apprenants" },
  { value: "INSTRUCTOR", label: "Formateurs" },
  { value: "GRADER", label: "Correcteurs" },
  { value: "ACADEMIC_ADMIN", label: "Admins pédago." },
  { value: "SALES_ADMIN", label: "Admins commerciaux" },
  { value: "SUPER_ADMIN", label: "Super admins" },
];

const VALID_ROLES = new Set<Role>([
  "LEARNER", "INSTRUCTOR", "GRADER", "MENTOR", "SCHOOL_MANAGER",
  "PATH_MANAGER", "ORG_MANAGER", "ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN",
]);

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function RoleChips({ roles }: { roles: Role[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r}
          className={
            ADMIN_ROLES.has(r)
              ? "rounded-full bg-brand-violet/10 px-2 py-0.5 text-[11px] font-semibold text-brand-violet"
              : "rounded-full bg-navy/[0.06] px-2 py-0.5 text-[11px] font-medium text-text-secondary"
          }
        >
          {ROLE_LABEL[r] ?? r}
        </span>
      ))}
    </div>
  );
}

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const roleParam = one(sp.role) as Role | undefined;
  const role = roleParam && VALID_ROLES.has(roleParam) ? roleParam : undefined;

  const [me, users, courseOptions] = await Promise.all([
    currentUser(),
    listUsersAdmin({ q, role }),
    listCoursesForPicker(),
  ]);
  const actorIsSuper = !!me?.roles.includes("SUPER_ADMIN");
  const enrollCourses = courseOptions.map((c) => ({ id: c.id, title: c.title, level: c.level, price: c.price }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Comptes"
        title="Utilisateurs"
        description="Recherchez, attribuez des rôles et activez ou désactivez les comptes. Le rôle super administrateur est protégé."
      />

      {/* Recherche + filtre rôle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form method="GET" role="search" className="relative w-full lg:max-w-sm">
          {role && <input type="hidden" name="role" value={role} />}
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher par nom ou email…"
            aria-label="Rechercher un utilisateur"
            className="h-11 w-full rounded-xl border border-navy/10 bg-surface-primary pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60"
          />
        </form>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {ROLE_FILTERS.map((f) => {
            const active = (role ?? "") === f.value;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f.value) params.set("role", f.value);
            const href = `/admin/utilisateurs${params.toString() ? `?${params}` : ""}`;
            return (
              <a
                key={f.value || "all"}
                href={href}
                aria-current={active ? "true" : undefined}
                className={
                  active
                    ? "shrink-0 rounded-full bg-gradient-da px-3.5 py-1.5 text-xs font-semibold text-white"
                    : "shrink-0 rounded-full border border-navy/10 px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-blue-vif/40 hover:text-navy"
                }
              >
                {f.label}
              </a>
            );
          })}
        </div>
      </div>

      {actorIsSuper && <ViewAsRole />}

      <p className="text-xs text-text-muted">
        {users.length} utilisateur{users.length > 1 ? "s" : ""}
        {q && <> pour « {q} »</>}
      </p>

      <AdminCard className="overflow-hidden">
        {users.length === 0 ? (
          <AdminEmpty
            icon={<Users size={34} className="text-text-muted opacity-50" />}
            title="Aucun utilisateur"
            description={q ? "Aucun résultat pour cette recherche." : "Aucun compte pour ce filtre."}
          />
        ) : (
          <>
            {/* ─── Tableau (desktop) ──────────────────────────────────────── */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/[0.07] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3 font-semibold">Utilisateur</th>
                    <th className="px-4 py-3 font-semibold">Rôles</th>
                    <th className="px-4 py-3 font-semibold">Statut</th>
                    <th className="px-4 py-3 font-semibold">Activité</th>
                    <th className="px-4 py-3 font-semibold">Inscrit le</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {users.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-surface-secondary/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={u.avatar ?? undefined} className="h-9 w-9 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy">{u.name}</p>
                            <p className="truncate text-xs text-text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RoleChips roles={u.roles} /></td>
                      <td className="px-4 py-3">
                        <StatusPill
                          label={u.deletedAt ? "Supprimé" : u.isActive ? "Actif" : "Inactif"}
                          tone={u.deletedAt ? "danger" : u.isActive ? "success" : "neutral"}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {u._count.enrollments} formation{u._count.enrollments > 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{dateFmt.format(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        <UserActions
                          user={{ id: u.id, name: u.name, roles: u.roles, isActive: u.isActive, isDeleted: !!u.deletedAt }}
                          actorIsSuper={actorIsSuper}
                          isSelf={u.id === me?.id}
                          courses={enrollCourses}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── Cartes (mobile) ────────────────────────────────────────── */}
            <ul className="divide-y divide-navy/[0.05] lg:hidden">
              {users.map((u) => (
                <li key={u.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={u.name} src={u.avatar ?? undefined} className="h-10 w-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy">{u.name}</p>
                      <p className="truncate text-xs text-text-muted">{u.email}</p>
                      <div className="mt-2"><RoleChips roles={u.roles} /></div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
                        <StatusPill label={u.deletedAt ? "Supprimé" : u.isActive ? "Actif" : "Inactif"} tone={u.deletedAt ? "danger" : u.isActive ? "success" : "neutral"} />
                        <span>·</span>
                        <span>{dateFmt.format(u.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <UserActions
                      user={{ id: u.id, name: u.name, roles: u.roles, isActive: u.isActive, isDeleted: !!u.deletedAt }}
                      actorIsSuper={actorIsSuper}
                      isSelf={u.id === me?.id}
                      courses={enrollCourses}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminCard>
    </div>
  );
}
