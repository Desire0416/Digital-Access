import { prisma } from "@da/db/client";
import { staffScope } from "./access";
import type { FollowUpAlert } from "./crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   Alertes de relance CALCULÉES (non bloquantes) : prospects sans prochaine
   action, relances dépassées, absence d'échange > 14 j, audits validés non
   envoyés. Scopées (commercial = ses dossiers ; admin = tout). Priorité au
   rouge (retard) en tête.
   ══════════════════════════════════════════════════════════════════════════ */

const dtf = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
const fmt = (d: Date) => dtf.format(d);

export async function getFollowUpAlerts(limit = 40): Promise<FollowUpAlert[]> {
  const scope = await staffScope();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const staleThreshold = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

  const pWhere = scope.scopeAll ? {} : { assignedToId: scope.user.id };
  const aWhere = scope.scopeAll
    ? {}
    : { OR: [{ authorId: scope.user.id }, { prospect: { assignedToId: scope.user.id } }] };

  const [prospects, audits] = await Promise.all([
    prisma.prospect.findMany({
      where: {
        archivedAt: null,
        status: { notIn: ["CONVERTED_TO_OPPORTUNITY", "NOT_INTERESTED", "UNREACHABLE", "ARCHIVED"] },
        ...pWhere,
      },
      orderBy: { nextActionDate: "asc" },
      take: 200,
      select: { id: true, nextAction: true, nextActionDate: true, lastActivityAt: true, organization: { select: { name: true } } },
    }),
    prisma.audit.findMany({
      where: { archivedAt: null, status: { in: ["VALIDATED", "READY_TO_SEND"] }, ...aWhere },
      take: 60,
      select: { id: true, reference: true, organization: { select: { name: true } } },
    }),
  ]);

  const alerts: FollowUpAlert[] = [];

  for (const p of prospects) {
    const name = p.organization.name;
    const href = `/admin/prospects/${p.id}`;
    if (p.nextActionDate && p.nextActionDate < startOfToday) {
      alerts.push({ id: `overdue-${p.id}`, kind: "overdue", tone: "red", title: `Relance en retard — ${name}`, description: `Prévue le ${fmt(p.nextActionDate)}.`, href });
    } else if (!p.nextAction && !p.nextActionDate) {
      alerts.push({ id: `noaction-${p.id}`, kind: "no_next_action", tone: "amber", title: `Aucune prochaine action — ${name}`, description: "Planifiez une relance pour ne pas perdre ce prospect.", href });
    } else if (!p.lastActivityAt || p.lastActivityAt < staleThreshold) {
      alerts.push({ id: `stale-${p.id}`, kind: "stale", tone: "amber", title: `Sans échange depuis 14 jours — ${name}`, description: "Reprenez contact avec ce prospect.", href });
    }
  }

  for (const a of audits) {
    alerts.push({
      id: `audit-${a.id}`, kind: "audit_not_sent", tone: "amber",
      title: `Audit à envoyer — ${a.organization.name}`,
      description: `L'audit ${a.reference} est validé mais pas encore envoyé.`,
      href: `/admin/audits/${a.id}`,
    });
  }

  alerts.sort((x, y) => (x.tone === "red" ? 0 : 1) - (y.tone === "red" ? 0 : 1));
  return alerts.slice(0, limit);
}
