import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Radio,
  Coins,
  CalendarClock,
  MessageSquareText,
  FileText,
} from "lucide-react";
import { formatDate } from "@da/ui";
import { AdminPageHeader, StatusPill, LEAD_STATUS, PROJECT_TYPE } from "@/components/admin/ui";
import { getLead, getAssignableAdmins } from "@/lib/admin-queries";
import { LeadDetailPanel } from "./LeadDetailPanel";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead, admins] = await Promise.all([getLead(id), getAssignableAdmins()]);
  if (!lead) notFound();

  const status = LEAD_STATUS[lead.status] ?? { label: lead.status, tone: "slate" as const };

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-brand-blue-royal"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au pipeline
        </Link>
      </div>

      <AdminPageHeader
        title={lead.name}
        description={lead.company ?? undefined}
      >
        <StatusPill label={status.label} tone={status.tone} />
      </AdminPageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(320px,380px)]">
        {/* Colonne principale — informations */}
        <div className="flex flex-col gap-6">
          {/* Coordonnées */}
          <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
            <h2 className="font-display text-base font-bold text-navy">Coordonnées</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">
                <a
                  href={`mailto:${lead.email}`}
                  className="break-all font-medium text-navy hover:text-brand-blue-royal"
                >
                  {lead.email}
                </a>
              </InfoRow>
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone">
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="font-medium text-navy hover:text-brand-blue-royal">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </InfoRow>
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Entreprise">
                {lead.company ? (
                  <span className="font-medium text-navy">{lead.company}</span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </InfoRow>
              <InfoRow icon={<Radio className="h-4 w-4" />} label="Source">
                {lead.source ? (
                  <span className="font-medium text-navy">{lead.source}</span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </InfoRow>
              <InfoRow icon={<FileText className="h-4 w-4" />} label="Type de projet">
                <span className="font-medium text-navy">
                  {PROJECT_TYPE[lead.projectType] ?? lead.projectType}
                </span>
              </InfoRow>
              <InfoRow icon={<Coins className="h-4 w-4" />} label="Budget indiqué">
                {lead.budget ? (
                  <span className="font-medium text-navy">{lead.budget}</span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </InfoRow>
              {lead.timeline && (
                <InfoRow icon={<CalendarClock className="h-4 w-4" />} label="Échéance souhaitée">
                  <span className="font-medium text-navy">{lead.timeline}</span>
                </InfoRow>
              )}
              <InfoRow icon={<CalendarClock className="h-4 w-4" />} label="Reçu le">
                <span className="font-medium text-navy">{formatDate(lead.createdAt)}</span>
              </InfoRow>
            </dl>
          </section>

          {/* Message */}
          <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
              <MessageSquareText className="h-4 w-4 text-brand-violet" />
              Message du prospect
            </h2>
            {lead.message ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {lead.message}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-text-muted">Aucun message fourni.</p>
            )}
          </section>

          {/* Documents */}
          {lead.documents.length > 0 && (
            <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
              <h2 className="font-display text-base font-bold text-navy">Documents joints</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {lead.documents.map((doc, i) => (
                  <li key={i}>
                    <a
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-navy/[0.07] px-3 py-2 text-sm font-medium text-navy transition-colors hover:border-brand-blue-royal/40 hover:text-brand-blue-royal"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="break-all">{fileName(doc, i)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Colonne latérale — actions (client) */}
        <LeadDetailPanel lead={lead} admins={admins} />
      </div>
    </>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy/[0.04] text-text-secondary">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</dt>
        <dd className="mt-0.5 text-sm">{children}</dd>
      </div>
    </div>
  );
}

function fileName(url: string, index: number): string {
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split("/").pop() ?? "");
    return name || `Document ${index + 1}`;
  } catch {
    return url.split("/").pop() || `Document ${index + 1}`;
  }
}
