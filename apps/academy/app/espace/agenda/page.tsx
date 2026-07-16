import type { Metadata } from "next";
import { CalendarClock, History, CalendarDays } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getUpcomingAgenda, getMyEvents } from "@/lib/events";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader, Panel } from "@/components/espace/parts";
import { AgendaCard, type AgendaCardItem } from "@/components/agenda/AgendaCard";

export const metadata: Metadata = { title: "Agenda" };

const dfDay = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/** Clé de jour (année-mois-jour) pour regrouper les rendez-vous d'une même date. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function groupByDay(items: AgendaCardItem[]): { key: string; label: string; items: AgendaCardItem[] }[] {
  const groups: { key: string; label: string; items: AgendaCardItem[] }[] = [];
  const byKey = new Map<string, { key: string; label: string; items: AgendaCardItem[] }>();
  for (const it of items) {
    const d = it.startAt instanceof Date ? it.startAt : new Date(it.startAt);
    const key = dayKey(d);
    let g = byKey.get(key);
    if (!g) {
      g = { key, label: dfDay.format(d), items: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    g.items.push(it);
  }
  return groups;
}

export default async function AgendaPage() {
  const user = await requireUser("/espace/agenda");
  const [agenda, myEvents] = await Promise.all([
    getUpcomingAgenda(user.id, { take: 20 }),
    getMyEvents(user.id),
  ]);

  const upcoming: AgendaCardItem[] = agenda.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    type: a.type,
    startAt: a.startAt,
    endAt: a.endAt,
    source: a.source,
    cohortName: a.cohortName,
    meetingUrl: a.meetingUrl,
    past: false,
  }));

  const past: AgendaCardItem[] = myEvents.past.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    type: e.type,
    startAt: e.startAt,
    endAt: e.endAt,
    source: "EVENT",
    cohortName: null,
    meetingUrl: null,
    past: true,
    attended: e.attended,
  }));

  const isEmpty = upcoming.length === 0 && past.length === 0;
  const days = groupByDay(upcoming);

  return (
    <div>
      <EspaceHeader
        title="Agenda"
        subtitle="Vos prochains rendez-vous : sessions de cohorte et événements auxquels vous êtes inscrit."
        action={{ label: "Tous les événements", href: "/evenements" }}
      />

      {isEmpty ? (
        <EmptyState
          icon={<CalendarDays size={40} className="text-brand-blue-vif/40" />}
          title="Aucun rendez-vous à l'horizon"
          description="Inscrivez-vous à un webinaire, un atelier ou une classe virtuelle pour retrouver vos prochaines dates ici."
          action={{ label: "Parcourir les événements", href: "/evenements" }}
        />
      ) : (
        <div className="space-y-10">
          {/* ── Prochains rendez-vous ── */}
          <section>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-da text-white shadow-brand" aria-hidden>
                <CalendarClock size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-navy">Prochains rendez-vous</h2>
                <p className="text-xs text-text-secondary">
                  {upcoming.length > 0
                    ? `${upcoming.length} rendez-vous à venir`
                    : "Aucun rendez-vous à venir"}
                </p>
              </div>
            </div>

            {upcoming.length > 0 ? (
              <div className="space-y-7">
                {days.map((g) => (
                  <div key={g.key}>
                    <p className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-violet">
                      <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" aria-hidden />
                      {g.label}
                    </p>
                    <StaggerGroup className="space-y-3">
                      {g.items.map((it) => (
                        <StaggerItem key={`${it.source}-${it.id}`}>
                          <AgendaCard item={it} />
                        </StaggerItem>
                      ))}
                    </StaggerGroup>
                  </div>
                ))}
              </div>
            ) : (
              <Panel>
                <p className="py-4 text-center text-sm text-text-secondary">
                  Vous n'avez aucun rendez-vous programmé pour le moment.
                </p>
              </Panel>
            )}
          </section>

          {/* ── Événements passés ── */}
          {past.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy/[0.05] text-text-muted" aria-hidden>
                  <History size={18} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-navy">Mes événements passés</h2>
                  <p className="text-xs text-text-secondary">Retrouvez votre présence et les replays disponibles.</p>
                </div>
              </div>

              <StaggerGroup className="space-y-3">
                {past.map((it) => (
                  <StaggerItem key={`past-${it.id}`}>
                    <AgendaCard item={it} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
