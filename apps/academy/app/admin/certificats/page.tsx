import Link from "next/link";
import { Award, ExternalLink, FileText, ShieldCheck, ShieldX } from "lucide-react";
import { getAdminCertificates } from "@/lib/admin-queries";
import {
  AdminPageHeader,
  AdminCard,
  EmptyState,
  StatCard,
  StatusPill,
  type Tone,
} from "@/components/admin/ui";
import { CERTIFICATE_TYPE_LABEL, CERTIFICATE_MENTION_LABEL } from "@/lib/learn-labels";
import { CertificateActions } from "@/components/admin/CertificateActions";
import { cn } from "@da/ui";

export const dynamic = "force-dynamic";

/* Statut d'un certificat → libellé + ton de pastille. */
const CERTIFICATE_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Actif", tone: "green" },
  REVOKED: { label: "Révoqué", tone: "red" },
  SUSPENDED: { label: "Suspendu", tone: "amber" },
};

function statusMeta(status: string): { label: string; tone: Tone } {
  return CERTIFICATE_STATUS[status] ?? { label: status, tone: "slate" };
}

function typeLabel(type: string): string {
  return CERTIFICATE_TYPE_LABEL[type] ?? type;
}

function mentionLabel(mention: string | null): string {
  if (!mention) return "—";
  return CERTIFICATE_MENTION_LABEL[mention] ?? mention;
}

function scoreLabel(score: number | null): string {
  return score === null ? "—" : `${score} %`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminCertificatesPage() {
  const certificates = await getAdminCertificates();

  const total = certificates.length;
  const activeCount = certificates.filter((c) => c.status === "ACTIVE").length;
  const revokedCount = certificates.filter((c) => c.status === "REVOKED").length;

  return (
    <>
      <AdminPageHeader
        title="Certificats"
        description="Registre des certificats délivrés par l'Academy. Vérifiez leur authenticité, téléchargez le PDF ou révoquez un certificat compromis."
      >
        <span className="rounded-full bg-navy/[0.06] px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {total} certificat{total > 1 ? "s" : ""}
        </span>
      </AdminPageHeader>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Award size={18} />} label="Certificats délivrés" value={total} tone="violet" />
        <StatCard icon={<ShieldCheck size={18} />} label="Actifs" value={activeCount} tone="green" />
        <StatCard icon={<ShieldX size={18} />} label="Révoqués" value={revokedCount} tone="red" />
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<Award size={20} />}
          title="Aucun certificat délivré"
          description="Les certificats obtenus par les apprenants à l'issue de leurs formations et parcours apparaîtront ici."
        />
      ) : (
        <AdminCard bodyClassName="p-0">
          {/* Tablette & desktop : tableau */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy/[0.08] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3.5">Apprenant</th>
                  <th className="px-4 py-3.5">Formation</th>
                  <th className="px-4 py-3.5">Numéro</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Mention</th>
                  <th className="px-4 py-3.5 text-right">Score</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5">Délivré le</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c) => {
                  const meta = statusMeta(c.status);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-navy/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-navy">{c.learnerName}</span>
                      </td>
                      <td className="px-4 py-4 text-text-secondary">{c.courseTitle}</td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-text-secondary">
                          {c.certificateNumber}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-text-secondary">{typeLabel(c.certificateType)}</td>
                      <td className="px-4 py-4 text-text-secondary">{mentionLabel(c.mention)}</td>
                      <td className="px-4 py-4 text-right font-medium text-navy">
                        {scoreLabel(c.finalScore)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill label={meta.label} tone={meta.tone} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-text-secondary">
                        {formatDate(c.issuedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <RowLinks number={c.certificateNumber} id={c.id} />
                          <CertificateActions id={c.id} status={c.status} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & tablette : cartes empilées */}
          <ul className="divide-y divide-navy/[0.06] lg:hidden">
            {certificates.map((c) => {
              const meta = statusMeta(c.status);
              return (
                <li key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-navy">{c.courseTitle}</h3>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">{c.learnerName}</p>
                    </div>
                    <StatusPill label={meta.label} tone={meta.tone} />
                  </div>

                  <p className="mt-2 font-mono text-xs text-text-muted">{c.certificateNumber}</p>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <Meta label="Type" value={typeLabel(c.certificateType)} />
                    <Meta label="Mention" value={mentionLabel(c.mention)} />
                    <Meta label="Score" value={scoreLabel(c.finalScore)} />
                    <Meta label="Délivré le" value={formatDate(c.issuedAt)} />
                  </dl>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <RowLinks number={c.certificateNumber} id={c.id} />
                    <CertificateActions id={c.id} status={c.status} />
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

/* Liens externes « Vérifier » (page publique) et « PDF » (endpoint API). */
function RowLinks({ number, id }: { number: string; id: string }) {
  const linkClass =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal";
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/verify/${number}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <ExternalLink size={13} />
        Vérifier
      </Link>
      <Link href={`/api/certificates/${id}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <FileText size={13} />
        PDF
      </Link>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("flex justify-between gap-2")}>
      <dt className="text-text-muted">{label}</dt>
      <dd className="truncate font-medium text-navy">{value}</dd>
    </div>
  );
}
