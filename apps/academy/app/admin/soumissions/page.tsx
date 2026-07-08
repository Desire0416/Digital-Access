import Link from "next/link";
import { ExternalLink, ClipboardCheck } from "lucide-react";
import { getAdminSubmissions } from "@/lib/admin-queries";
import { AdminPageHeader, AdminCard, EmptyState, StatusPill, type Tone } from "@/components/admin/ui";
import { SUBMISSION_STATUS_LABEL } from "@/lib/learn-labels";
import { cn } from "@da/ui";

export const dynamic = "force-dynamic";

/* Filtres de statut proposés en tête de page (le premier = « Tous »). */
const FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "SUBMITTED", label: SUBMISSION_STATUS_LABEL.SUBMITTED },
  { value: "UNDER_REVIEW", label: SUBMISSION_STATUS_LABEL.UNDER_REVIEW },
  { value: "VALIDATED", label: SUBMISSION_STATUS_LABEL.VALIDATED },
  { value: "REVISION_REQUESTED", label: SUBMISSION_STATUS_LABEL.REVISION_REQUESTED },
  { value: "REJECTED", label: SUBMISSION_STATUS_LABEL.REJECTED },
];

/** Ton de la pastille selon le statut de la soumission. */
function submissionTone(status: string): Tone {
  switch (status) {
    case "VALIDATED":
    case "PORTFOLIO_READY":
      return "green";
    case "REJECTED":
      return "red";
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "REVISION_REQUESTED":
      return "amber";
    default:
      return "slate";
  }
}

function statusLabel(status: string): string {
  return SUBMISSION_STATUS_LABEL[status] ?? status;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function scoreLabel(score: number | null): string {
  return score === null ? "—" : `${score}/100`;
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status && FILTERS.some((f) => f.value === status) ? status : "ALL";
  const submissions = await getAdminSubmissions(active);

  return (
    <>
      <AdminPageHeader
        title="Soumissions de projets"
        description="Supervision des livrables déposés par les apprenants. La notation reste du ressort des relecteurs — ouvrez une soumission pour consulter son évaluation."
      >
        <span className="rounded-full bg-navy/[0.06] px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {submissions.length} soumission{submissions.length > 1 ? "s" : ""}
        </span>
      </AdminPageHeader>

      {/* Filtres de statut (liens ?status=) */}
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        {FILTERS.map((f) => {
          const isActive = f.value === active;
          const href = f.value === "ALL" ? "/admin/soumissions" : `/admin/soumissions?status=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-gradient-da text-white shadow-sm"
                  : "border border-navy/10 text-text-secondary hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {submissions.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={20} />}
          title="Aucune soumission"
          description={
            active === "ALL"
              ? "Les projets déposés par les apprenants apparaîtront ici, tous statuts confondus."
              : "Aucune soumission ne correspond à ce statut pour le moment."
          }
        />
      ) : (
        <AdminCard bodyClassName="p-0">
          {/* Tablette & desktop : tableau */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy/[0.08] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3.5">Apprenant</th>
                  <th className="px-4 py-3.5">Projet</th>
                  <th className="px-4 py-3.5">Parcours</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5 text-right">Score</th>
                  <th className="px-4 py-3.5">Relecteur</th>
                  <th className="px-4 py-3.5">Soumis le</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-navy/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-navy">{s.learnerName}</span>
                    </td>
                    <td className="px-4 py-4 text-text-secondary">{s.projectTitle}</td>
                    <td className="px-4 py-4 text-text-secondary">{s.careerPathTitle}</td>
                    <td className="px-4 py-4">
                      <StatusPill label={statusLabel(s.status)} tone={submissionTone(s.status)} />
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-navy">{scoreLabel(s.score)}</td>
                    <td className="px-4 py-4 text-text-secondary">{s.reviewerName ?? "—"}</td>
                    <td className="px-4 py-4 text-text-secondary">{formatDate(s.submittedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <OpenLink id={s.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile : cartes empilées */}
          <ul className="divide-y divide-navy/[0.06] md:hidden">
            {submissions.map((s) => (
              <li key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-navy">{s.projectTitle}</h3>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">{s.learnerName}</p>
                  </div>
                  <StatusPill label={statusLabel(s.status)} tone={submissionTone(s.status)} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <Meta label="Parcours" value={s.careerPathTitle} />
                  <Meta label="Score" value={scoreLabel(s.score)} />
                  <Meta label="Relecteur" value={s.reviewerName ?? "—"} />
                  <Meta label="Soumis le" value={formatDate(s.submittedAt)} />
                </dl>

                <div className="mt-3">
                  <OpenLink id={s.id} full />
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </>
  );
}

function OpenLink({ id, full }: { id: string; full?: boolean }) {
  return (
    <Link
      href={`/reviews/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
        full && "w-full px-3 py-2",
      )}
    >
      <ExternalLink size={13} />
      Ouvrir
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-text-muted">{label}</dt>
      <dd className="truncate font-medium text-navy">{value}</dd>
    </div>
  );
}
