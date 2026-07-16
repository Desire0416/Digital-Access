import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Users, ChevronRight, Search, UsersRound, Video } from "lucide-react";
import type { EventStatus, EventType } from "@da/academy-db/client";
import { listEventsAdmin } from "@/lib/event-admin-queries";
import { createEvent } from "@/lib/event-admin-actions";
import { AdminPageHeader, AdminCard, StatusPill, AdminEmpty, type PillTone } from "@/components/admin/ui";
import { QuickCreate } from "@/components/admin/QuickCreate";

export const metadata: Metadata = { title: "Événements — Administration" };

/* ─── Libellés & tons locaux (Event*) ──────────────────────────────────────── */

const EVENT_STATUS_LABEL: Record<string, string> = { DRAFT: "Brouillon", PUBLISHED: "Publié", CANCELLED: "Annulé" };
const EVENT_STATUS_TONE: Record<string, PillTone> = { DRAFT: "neutral", PUBLISHED: "success", CANCELLED: "danger" };
const EVENT_TYPE_LABEL: Record<string, string> = {
  WEBINAR: "Webinaire",
  VIRTUAL_CLASS: "Classe virtuelle",
  WORKSHOP: "Atelier",
  DEFENSE: "Soutenance",
  MENTORING: "Mentorat",
  CONFERENCE: "Conférence",
  QA_SESSION: "Questions-réponses",
};
const EVENT_AUDIENCE_LABEL: Record<string, string> = { PUBLIC: "Public", ENROLLED: "Inscrits", COHORT: "Cohorte" };

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "DRAFT", label: "Brouillons" },
  { value: "PUBLISHED", label: "Publiés" },
  { value: "CANCELLED", label: "Annulés" },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous les types" },
  ...Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ value, label })),
];

const VALID_STATUS = new Set<EventStatus>(["DRAFT", "PUBLISHED", "CANCELLED"]);
const VALID_TYPE = new Set<EventType>(["WEBINAR", "VIRTUAL_CLASS", "WORKSHOP", "DEFENSE", "MENTORING", "CONFERENCE", "QA_SESSION"]);

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
function formatDateTime(d: Date | string | null | undefined): string {
  return d ? dateTimeFmt.format(new Date(d)) : "—";
}

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminEvenementsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const statusParam = one(sp.status) as EventStatus | undefined;
  const typeParam = one(sp.type) as EventType | undefined;
  const status = statusParam && VALID_STATUS.has(statusParam) ? statusParam : undefined;
  const type = typeParam && VALID_TYPE.has(typeParam) ? typeParam : undefined;

  const events = await listEventsAdmin({ q, status, type });

  function filterHref(next: { status?: string; type?: string }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const s = next.status !== undefined ? next.status : (status ?? "");
    const t = next.type !== undefined ? next.type : (type ?? "");
    if (s) params.set("status", s);
    if (t) params.set("type", t);
    return `/admin/evenements${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Vie de l'académie"
        title="Événements"
        description="Webinaires, classes virtuelles, ateliers et soutenances. Créez un événement, rattachez-le à une cohorte ou une formation, partagez le lien de visio et suivez les présences."
        actions={
          <QuickCreate
            action={createEvent}
            redirectBase="/admin/evenements"
            buttonLabel="Nouvel événement"
            modalTitle="Créer un événement"
            fieldLabel="Titre de l'événement"
            placeholder="Ex. Webinaire — Réussir son portfolio"
          />
        }
      />

      {/* Recherche + filtres */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form method="GET" role="search" className="relative w-full lg:max-w-sm">
            {status && <input type="hidden" name="status" value={status} />}
            {type && <input type="hidden" name="type" value={type} />}
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Rechercher un événement…"
              aria-label="Rechercher un événement"
              className="h-11 w-full rounded-xl border border-navy/10 bg-surface-primary pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60"
            />
          </form>

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {STATUS_FILTERS.map((f) => {
              const active = (status ?? "") === f.value;
              return (
                <a
                  key={f.value || "all"}
                  href={filterHref({ status: f.value })}
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

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {TYPE_FILTERS.map((f) => {
            const active = (type ?? "") === f.value;
            return (
              <a
                key={f.value || "all-types"}
                href={filterHref({ type: f.value })}
                aria-current={active ? "true" : undefined}
                className={
                  active
                    ? "shrink-0 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white"
                    : "shrink-0 rounded-full border border-navy/10 px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-navy/30 hover:text-navy"
                }
              >
                {f.label}
              </a>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-text-muted">
        {events.length} événement{events.length > 1 ? "s" : ""}
        {q && <> pour « {q} »</>}
      </p>

      <AdminCard className="overflow-hidden">
        {events.length === 0 ? (
          <AdminEmpty
            icon={<CalendarDays size={34} className="text-text-muted opacity-50" />}
            title="Aucun événement"
            description={q || status || type ? "Aucun résultat pour ce filtre." : "Créez votre premier événement pour animer votre communauté."}
          />
        ) : (
          <>
            {/* Tableau (desktop) */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/[0.07] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3">Événement</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Audience</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Cohorte</th>
                    <th className="px-4 py-3">Inscrits</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Ouvrir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {events.map((e) => (
                    <tr key={e.id} className="group transition-colors hover:bg-surface-secondary/50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/evenements/${e.id}`} className="flex min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-blue-vif/10 text-brand-blue-royal" aria-hidden>
                            <Video size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy group-hover:text-brand-blue-royal">{e.title}</p>
                            <p className="truncate text-xs text-text-muted">/{e.slug}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{EVENT_TYPE_LABEL[e.type] ?? e.type}</td>
                      <td className="px-4 py-3 text-text-secondary">{EVENT_AUDIENCE_LABEL[e.audience] ?? e.audience}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDateTime(e.startAt)}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {e.cohort?.name ? (
                          <span className="inline-flex items-center gap-1.5">
                            <UsersRound size={13} className="shrink-0 text-brand-violet" />
                            <span className="truncate">{e.cohort.name}</span>
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{e._count.registrations}</td>
                      <td className="px-4 py-3">
                        <StatusPill label={EVENT_STATUS_LABEL[e.status] ?? e.status} tone={EVENT_STATUS_TONE[e.status] ?? "neutral"} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/evenements/${e.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
                        >
                          Éditer <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cartes (mobile) */}
            <ul className="divide-y divide-navy/[0.05] lg:hidden">
              {events.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/evenements/${e.id}`} className="block p-4 transition-colors hover:bg-surface-secondary/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{e.title}</p>
                        <p className="mt-0.5 truncate text-xs text-text-muted">
                          {EVENT_TYPE_LABEL[e.type] ?? e.type} · {EVENT_AUDIENCE_LABEL[e.audience] ?? e.audience}
                        </p>
                      </div>
                      <StatusPill label={EVENT_STATUS_LABEL[e.status] ?? e.status} tone={EVENT_STATUS_TONE[e.status] ?? "neutral"} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} /> {formatDateTime(e.startAt)}
                      </span>
                      {e.cohort?.name && (
                        <span className="inline-flex items-center gap-1">
                          <UsersRound size={12} /> {e.cohort.name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} /> {e._count.registrations}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminCard>
    </div>
  );
}
