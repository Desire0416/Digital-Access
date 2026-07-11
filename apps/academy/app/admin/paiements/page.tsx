import Link from "next/link";
import { CreditCard, ExternalLink } from "lucide-react";
import { formatFCFA, cn } from "@da/ui";
import { getAdminPayments } from "@/lib/payment-queries";
import { AdminPageHeader, AdminCard, EmptyState, StatusPill, type Tone } from "@/components/admin/ui";
import { PaymentActions } from "@/components/admin/PaymentActions";

export const dynamic = "force-dynamic";

const FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Validés" },
  { value: "FAILED", label: "Rejetés" },
];

function statusMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "PAID":
      return { label: "Validé", tone: "green" };
    case "FAILED":
    case "CANCELLED":
      return { label: "Rejeté", tone: "red" };
    case "PENDING":
    case "MANUAL_REVIEW":
      return { label: "En attente", tone: "amber" };
    case "REFUNDED":
      return { label: "Remboursé", tone: "slate" };
    default:
      return { label: status, tone: "slate" };
  }
}

const OP_COLOR: Record<string, string> = { ORANGE: "#FF7900", MTN: "#FFCC00", WAVE: "#00C2F3" };

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function isActionable(status: string): boolean {
  return status === "PENDING" || status === "MANUAL_REVIEW";
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status && FILTERS.some((f) => f.value === status) ? status : "ALL";

  const all = await getAdminPayments();
  const rows = active === "ALL" ? all : all.filter((p) => statusMeta(p.status).label === statusMeta(active).label || p.status === active);
  const pendingCount = all.filter((p) => isActionable(p.status)).length;

  return (
    <>
      <AdminPageHeader
        title="Paiements Mobile Money"
        description="Vérifiez les preuves de paiement déposées par les apprenants (Orange, MTN, Wave). Valider un paiement ouvre immédiatement l'accès à la formation. Une preuve ne donne jamais accès sans votre validation."
      >
        <span className={cn("rounded-full px-3 py-1.5 text-sm font-semibold", pendingCount > 0 ? "bg-warning/15 text-warning" : "bg-navy/[0.06] text-text-secondary")}>
          {pendingCount} en attente
        </span>
      </AdminPageHeader>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        {FILTERS.map((f) => {
          const isActive = f.value === active;
          const href = f.value === "ALL" ? "/admin/paiements" : `/admin/paiements?status=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                isActive ? "bg-gradient-da text-white shadow-sm" : "border border-navy/10 text-text-secondary hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={20} />}
          title="Aucun paiement"
          description={active === "ALL" ? "Les preuves de paiement déposées par les apprenants apparaîtront ici." : "Aucun paiement ne correspond à ce filtre."}
        />
      ) : (
        <AdminCard bodyClassName="p-0">
          {/* Desktop */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy/[0.08] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3.5">Apprenant</th>
                  <th className="px-4 py-3.5">Formation</th>
                  <th className="px-4 py-3.5">Opérateur</th>
                  <th className="px-4 py-3.5">ID transaction</th>
                  <th className="px-4 py-3.5 text-right">Montant</th>
                  <th className="px-4 py-3.5">Preuve</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const sm = statusMeta(p.status);
                  return (
                    <tr key={p.id} className="border-b border-navy/[0.05] align-top transition-colors last:border-0 hover:bg-navy/[0.02]">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-navy">{p.learnerName}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{p.learnerEmail}</p>
                        {p.phone && <p className="mt-0.5 font-mono text-xs text-text-secondary">{p.phone}</p>}
                      </td>
                      <td className="px-4 py-4 text-text-secondary">
                        {p.targetSlug ? (
                          <Link href={`/career-paths/${p.targetSlug}`} target="_blank" className="font-medium text-navy underline-offset-2 hover:underline">
                            {p.targetTitle}
                          </Link>
                        ) : p.targetTitle}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 font-medium text-navy">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: OP_COLOR[p.operator] ?? "#94a3b8" }} />
                          {p.operator}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-text-secondary">{p.reference ?? "—"}</td>
                      <td className="px-4 py-4 text-right font-semibold text-navy">{formatFCFA(p.amount)}</td>
                      <td className="px-4 py-4"><ProofThumb url={p.proofUrl} /></td>
                      <td className="px-4 py-4">
                        <StatusPill label={sm.label} tone={sm.tone} />
                        {p.status === "FAILED" && p.rejectionReason && (
                          <p className="mt-1 max-w-[12rem] text-xs italic text-text-muted">{p.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-text-secondary">{formatDate(p.createdAt)}</td>
                      <td className="px-5 py-4">
                        <PaymentActions paymentId={p.id} actionable={isActionable(p.status)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablette */}
          <ul className="divide-y divide-navy/[0.06] lg:hidden">
            {rows.map((p) => {
              const sm = statusMeta(p.status);
              return (
                <li key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-navy">{p.learnerName}</h3>
                      <p className="mt-0.5 truncate text-xs text-text-muted">{p.learnerEmail}</p>
                    </div>
                    <StatusPill label={sm.label} tone={sm.tone} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-navy">{p.targetTitle}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <Meta label="Opérateur" value={p.operator} />
                    <Meta label="Montant" value={formatFCFA(p.amount)} />
                    <Meta label="ID" value={p.reference ?? "—"} mono />
                    <Meta label="Date" value={formatDate(p.createdAt)} />
                  </dl>
                  {p.status === "FAILED" && p.rejectionReason && (
                    <p className="mt-2 text-xs italic text-text-muted">Motif : {p.rejectionReason}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <ProofThumb url={p.proofUrl} />
                    <PaymentActions paymentId={p.id} actionable={isActionable(p.status)} />
                  </div>
                </li>
              );
            })}
          </ul>
        </AdminCard>
      )}
    </>
  );
}

function ProofThumb({ url }: { url: string | null }) {
  if (!url) return <span className="text-xs text-text-muted">—</span>;
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Ouvrir la preuve"
      className="group inline-flex items-center gap-1.5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Preuve de paiement" className="h-12 w-12 rounded-lg border border-navy/10 object-cover transition-transform group-hover:scale-105" />
      <ExternalLink size={13} className="text-text-muted group-hover:text-brand-blue-royal" />
    </Link>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-text-muted">{label}</dt>
      <dd className={cn("truncate font-medium text-navy", mono && "font-mono text-[11px]")}>{value}</dd>
    </div>
  );
}
