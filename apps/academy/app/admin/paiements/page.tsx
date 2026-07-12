import type { Metadata } from "next";
import { CreditCard, Phone, Hash, Clock } from "lucide-react";
import type { PaymentStatus } from "@da/academy-db/client";
import { listPaymentsAdmin } from "@/lib/admin-queries";
import { formatFCFA } from "@/lib/site";
import {
  AdminPageHeader,
  AdminCard,
  StatusPill,
  AdminEmpty,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  PAYMENT_PURPOSE_LABEL,
} from "@/components/admin/ui";
import { ProofThumb, PaymentActions } from "./PaymentActions";

export const metadata: Metadata = { title: "Paiements — Administration" };

const OPERATOR: Record<string, { label: string; color: string }> = {
  ORANGE: { label: "Orange Money", color: "#FF7900" },
  MTN: { label: "MTN MoMo", color: "#FFCC00" },
  WAVE: { label: "Wave", color: "#00C2F3" },
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Validés" },
  { value: "FAILED", label: "Rejetés" },
];

const VALID_STATUSES = new Set<PaymentStatus>([
  "PENDING", "PARTIAL", "PAID", "FAILED", "CANCELLED", "REFUNDED", "EXPIRED",
]);

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const statusParam = one(sp.status) as PaymentStatus | undefined;
  const status = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : undefined;

  const payments = await listPaymentsAdmin({ status });
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Mobile Money"
        title="Paiements"
        description="Vérifiez les preuves de paiement Mobile Money. La validation ouvre l'accès ; aucune preuve ne donne accès sans votre approbation."
        actions={
          pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1.5 text-xs font-semibold text-[#b45309]">
              <Clock size={13} />
              {pendingCount} en attente
            </span>
          ) : undefined
        }
      />

      {/* Filtres statut */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          const href = `/admin/paiements${f.value ? `?status=${f.value}` : ""}`;
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

      {payments.length === 0 ? (
        <AdminCard>
          <AdminEmpty
            icon={<CreditCard size={34} className="text-text-muted opacity-50" />}
            title="Aucun paiement"
            description={status ? "Aucun paiement pour ce filtre." : "Les dépôts de preuve Mobile Money apparaîtront ici."}
          />
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const op = p.operator ? OPERATOR[p.operator] : null;
            const target = p.course?.title ?? p.careerPath?.title ?? PAYMENT_PURPOSE_LABEL[p.purpose] ?? "—";
            const kind = p.course ? "Formation" : p.careerPath ? "Parcours" : PAYMENT_PURPOSE_LABEL[p.purpose];
            return (
              <AdminCard key={p.id} className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Preuve + montant */}
                  <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                    {p.proofUrl ? (
                      <ProofThumb url={p.proofUrl} reference={p.reference} />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-dashed border-navy/15 text-text-muted">
                        <CreditCard size={16} />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-display text-lg font-bold leading-tight text-navy">{formatFCFA(p.amount)}</p>
                      {op && (
                        <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: op.color }} aria-hidden />
                          {op.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cible + apprenant */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-navy/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-text-secondary">{kind}</span>
                      <p className="truncate text-sm font-semibold text-navy">{target}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-text-secondary">
                      {p.user.name} · <span className="text-text-muted">{p.user.email}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                      {p.reference && (
                        <span className="inline-flex items-center gap-1"><Hash size={11} />{p.reference}</span>
                      )}
                      {p.payerPhone && (
                        <span className="inline-flex items-center gap-1"><Phone size={11} />{p.payerPhone}</span>
                      )}
                      <span className="inline-flex items-center gap-1"><Clock size={11} />{dateFmt.format(p.createdAt)}</span>
                    </div>
                    {p.status === "FAILED" && p.rejectReason && (
                      <p className="mt-1.5 rounded-lg bg-error/[0.05] px-2.5 py-1.5 text-xs text-error">
                        Motif du rejet : {p.rejectReason}
                      </p>
                    )}
                  </div>

                  {/* Statut + actions */}
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <StatusPill
                      label={PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                      tone={PAYMENT_STATUS_TONE[p.status] ?? "neutral"}
                    />
                    {p.status === "PENDING" ? (
                      <PaymentActions paymentId={p.id} learnerName={p.user.name} />
                    ) : (
                      p.processedBy && (
                        <span className="text-[11px] text-text-muted">par {p.processedBy.name}</span>
                      )
                    )}
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
