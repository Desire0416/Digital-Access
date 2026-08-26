import type { Metadata } from "next";
import { Search, MailPlus, Clock, UserX, BookOpen } from "lucide-react";
import { Avatar } from "@da/ui";
import { listInactiveUsers, countInactiveUsers, type ReengagementSegment } from "@/lib/reengagement-queries";
import { AdminPageHeader, AdminCard, AdminEmpty, StatusPill } from "@/components/admin/ui";
import { ReengageDialog } from "./ReengageDialog";

export const metadata: Metadata = { title: "Relance des inscrits — Administration" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function sinceDays(d: Date | null): number | null {
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminRelancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const segRaw = one(sp.segment);
  const segment: ReengagementSegment = segRaw === "never" || segRaw === "dormant" ? segRaw : "all";

  const [users, counts] = await Promise.all([listInactiveUsers({ q, segment }), countInactiveUsers()]);

  const TABS: { value: ReengagementSegment; label: string; count?: number }[] = [
    { value: "all", label: "Tous" },
    { value: "never", label: "Jamais connectés", count: counts.never },
    { value: "dormant", label: "Dormants (> 14 j)", count: counts.dormant },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Réengagement"
        title="Relance des inscrits inactifs"
        description="Les personnes inscrites qui ne se sont jamais connectées ou ne sont pas revenues. L'IA rédige un email marketing personnalisé (recommandations de formations) que vous relisez avant l'envoi."
      />

      {/* Filtres */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form method="GET" role="search" className="relative w-full lg:max-w-sm">
          {segment !== "all" && <input type="hidden" name="segment" value={segment} />}
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher par nom ou email…"
            aria-label="Rechercher un inscrit"
            className="h-11 w-full rounded-xl border border-navy/10 bg-surface-primary pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60"
          />
        </form>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {TABS.map((t) => {
            const active = segment === t.value;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (t.value !== "all") params.set("segment", t.value);
            const href = `/admin/relance${params.toString() ? `?${params}` : ""}`;
            return (
              <a
                key={t.value}
                href={href}
                aria-current={active ? "true" : undefined}
                className={
                  active
                    ? "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-da px-3.5 py-1.5 text-xs font-semibold text-white"
                    : "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-navy/10 px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-blue-vif/40 hover:text-navy"
                }
              >
                {t.label}
                {typeof t.count === "number" && (
                  <span className={active ? "rounded-full bg-white/20 px-1.5 text-[10px]" : "rounded-full bg-navy/[0.06] px-1.5 text-[10px]"}>{t.count}</span>
                )}
              </a>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-text-muted">
        {users.length} inscrit{users.length > 1 ? "s" : ""} à relancer{q && <> pour « {q} »</>}
      </p>

      <AdminCard className="overflow-hidden">
        {users.length === 0 ? (
          <AdminEmpty
            icon={<MailPlus size={34} className="text-text-muted opacity-50" />}
            title="Personne à relancer"
            description={q ? "Aucun résultat pour cette recherche." : "Tous les inscrits de ce segment sont actifs. 🎉"}
          />
        ) : (
          <ul className="divide-y divide-navy/[0.05]">
            {users.map((u) => {
              const days = sinceDays(u.lastActiveAt);
              return (
                <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={u.name} src={u.avatar ?? undefined} className="h-11 w-11 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{u.name}</p>
                      <p className="truncate text-xs text-text-muted">{u.email}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                        {u.neverConnected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 font-semibold text-error">
                            <UserX size={11} aria-hidden /> Jamais connecté
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 font-semibold text-[#b45309]">
                            <Clock size={11} aria-hidden /> Inactif depuis {days} j
                          </span>
                        )}
                        {!u.emailVerified && (
                          <span className="rounded-full bg-navy/[0.06] px-2 py-0.5">Email non vérifié</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <BookOpen size={11} aria-hidden /> {u._count.enrollments}
                        </span>
                        <span>Inscrit le {dateFmt.format(u.createdAt)}</span>
                        {u.lastReengagement && (
                          <StatusPill label={`Relancé le ${dateFmt.format(u.lastReengagement.createdAt)}`} tone="info" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 sm:pl-3">
                    <ReengageDialog userId={u.id} userName={u.name} userEmail={u.email} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
