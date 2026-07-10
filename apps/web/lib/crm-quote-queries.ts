import { prisma } from "@da/db/client";
import { staffScope } from "./access";
import type { QuoteDetail, QuoteLineItem } from "./crm-types";

/* Data layer Devis (LECTURE). Accès : admin, ou responsable de l'opportunité liée. */

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export async function getQuote(id: string): Promise<QuoteDetail | null> {
  const scope = await staffScope();
  const q = await prisma.quote.findUnique({
    where: { id },
    select: {
      id: true, number: true, title: true, status: true, items: true, amount: true, tax: true, total: true,
      currency: true, notes: true, sentAt: true, acceptedAt: true, rejectedAt: true, expiresAt: true, createdAt: true,
      organization: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true, assignedToId: true } },
      contact: { select: { fullName: true } },
    },
  });
  if (!q) return null;
  // Sécurité : admin, ou responsable de l'opportunité.
  if (!scope.scopeAll && q.deal?.assignedToId !== scope.user.id) return null;

  const items = (Array.isArray(q.items) ? q.items : []) as unknown as QuoteLineItem[];
  return {
    id: q.id, number: q.number, title: q.title, status: q.status as never,
    items: items.map((it) => ({ label: String(it.label ?? ""), quantity: Number(it.quantity ?? 0), unitPrice: Number(it.unitPrice ?? 0) })),
    amount: q.amount, tax: q.tax, total: q.total, currency: q.currency, notes: q.notes,
    sentAt: iso(q.sentAt), acceptedAt: iso(q.acceptedAt), rejectedAt: iso(q.rejectedAt),
    expiresAt: iso(q.expiresAt), createdAt: iso(q.createdAt)!,
    organization: q.organization ? { id: q.organization.id, name: q.organization.name } : null,
    dealId: q.deal?.id ?? null, dealTitle: q.deal?.title ?? null, contactName: q.contact?.fullName ?? null,
  };
}
