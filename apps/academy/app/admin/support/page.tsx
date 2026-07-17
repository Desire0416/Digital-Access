import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";
import { listTicketsAdmin } from "@/lib/support-admin-queries";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_CATEGORY_LABEL, TICKET_PRIORITY_LABEL } from "@/lib/support-labels";
import { AdminPageHeader, AdminCard, AdminEmpty, StatusPill } from "@/components/admin/ui";
import type { TicketStatus } from "@da/academy-db/client";

export const metadata: Metadata = { title: "Support — Administration" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_LEARNER", "RESOLVED", "CLOSED"];

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() || undefined;
  const statusRaw = one(sp.status);
  const status = STATUSES.includes(statusRaw as TicketStatus) ? (statusRaw as TicketStatus) : undefined;

  const tickets = await listTicketsAdmin({ status, q });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Communauté"
        title="Support"
        description="Répondez aux demandes des apprenants, ajustez le statut et la priorité, assignez les tickets."
      />

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href="/admin/support" label="Tous" active={!status} />
        {STATUSES.map((s) => (
          <FilterChip key={s} href={`/admin/support?status=${s}`} label={TICKET_STATUS_LABEL[s]} active={status === s} />
        ))}
        <form action="/admin/support" method="GET" className="ml-auto">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Sujet ou #numéro…"
            className="h-9 w-52 rounded-full border border-navy/12 bg-surface-primary px-4 text-sm text-navy outline-none transition-colors focus:border-brand-blue-vif/60"
          />
        </form>
      </div>

      {tickets.length === 0 ? (
        <AdminEmpty title="Aucun ticket" description="Aucune demande ne correspond à ces filtres." />
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <ul className="divide-y divide-navy/[0.06]">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link href={`/admin/support/${t.id}`} className="group flex items-center gap-4 p-4 transition-colors hover:bg-brand-blue-vif/[0.03]">
                  <span className="hidden shrink-0 text-xs font-bold text-text-muted sm:block">#{t.number}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusPill label={TICKET_STATUS_LABEL[t.status]} tone={TICKET_STATUS_TONE[t.status]} />
                      <span className="text-[11px] font-medium text-text-muted">{TICKET_CATEGORY_LABEL[t.category]}</span>
                      {(t.priority === "HIGH" || t.priority === "URGENT") && (
                        <span className="text-[11px] font-bold text-error">{TICKET_PRIORITY_LABEL[t.priority]}</span>
                      )}
                    </div>
                    <p className="mt-1 truncate font-display text-sm font-bold text-navy">{t.subject}</p>
                    <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-text-muted">
                      <span>{t.user.name}</span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare size={12} aria-hidden />
                        {t._count.messages}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{dateFmt.format(t.updatedAt)}</span>
                      {t.assignedTo && (
                        <>
                          <span aria-hidden>·</span>
                          <span>→ {t.assignedTo.name}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <ArrowRight size={16} className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-blue-royal" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-gradient-da px-3.5 py-1.5 text-xs font-semibold text-white shadow-brand"
          : "rounded-full border border-navy/12 px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-navy/25 hover:text-navy"
      }
    >
      {label}
    </Link>
  );
}
