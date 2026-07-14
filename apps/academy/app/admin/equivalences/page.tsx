import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Clock, User2 } from "lucide-react";
import type { EquivalenceStatus } from "@da/academy-db/client";
import { listEquivalencesAdmin } from "@/lib/equivalences";
import {
  AdminPageHeader,
  AdminCard,
  StatusPill,
  AdminEmpty,
} from "@/components/admin/ui";
import {
  EVIDENCE_TYPE_LABEL,
  EQUIVALENCE_STATUS_LABEL,
  EQUIVALENCE_STATUS_TONE,
} from "@/lib/equivalence-labels";
import { EquivalenceActions, ProofThumb } from "./EquivalenceActions";

export const metadata: Metadata = { title: "Équivalences — Administration" };

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "ACCEPTED", label: "Acceptées" },
  { value: "PARTIAL", label: "Partielles" },
  { value: "CONDITIONAL", label: "Conditionnelles" },
  { value: "REJECTED", label: "Refusées" },
];

const VALID_STATUSES = new Set<EquivalenceStatus>([
  "PENDING",
  "ACCEPTED",
  "PARTIAL",
  "CONDITIONAL",
  "REJECTED",
]);

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminEquivalencesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const statusParam = one(sp.status) as EquivalenceStatus | undefined;
  const status = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : undefined;

  const requests = await listEquivalencesAdmin({ status });
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Reconnaissance des acquis"
        title="Équivalences"
        description="Examinez les preuves déposées (certificat, diplôme, portfolio, expérience). Une décision « acceptée » ou « partielle » ouvre l'accès à la formation ; aucune preuve ne donne accès sans votre validation."
        actions={
          pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1.5 text-xs font-semibold text-[#b45309]">
              <Clock size={13} />
              {pendingCount} en attente
            </span>
          ) : undefined
        }
      />

      {/* Filtres de statut */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value || "all"}
              href={f.value ? `/admin/equivalences?status=${f.value}` : "/admin/equivalences"}
              className={
                active
                  ? "rounded-full bg-gradient-da px-3.5 py-1.5 text-xs font-semibold text-white shadow-brand"
                  : "rounded-full border border-navy/12 bg-surface-primary px-3.5 py-1.5 text-xs font-semibold text-navy/70 transition-colors hover:border-navy/25 hover:text-navy"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {requests.length === 0 ? (
        <AdminEmpty
          title="Aucune demande d'équivalence"
          description="Les demandes déposées par les apprenants apparaîtront ici pour validation."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <AdminCard key={r.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 font-display text-base font-bold text-navy">
                      <BadgeCheck size={16} className="shrink-0 text-brand-blue-royal" />
                      <Link
                        href={`/formations/${r.courseSlug}`}
                        className="transition-colors hover:text-brand-blue-royal"
                      >
                        {r.courseTitle}
                      </Link>
                    </span>
                    <StatusPill
                      label={EQUIVALENCE_STATUS_LABEL[r.status]}
                      tone={EQUIVALENCE_STATUS_TONE[r.status]}
                    />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <User2 size={12} />
                      {r.learnerName} · {r.learnerEmail}
                    </span>
                    <span aria-hidden>•</span>
                    <span>{EVIDENCE_TYPE_LABEL[r.evidenceType]}</span>
                    <span aria-hidden>•</span>
                    <span>{dateFmt.format(r.createdAt)}</span>
                  </p>
                </div>

                {r.status === "PENDING" && (
                  <EquivalenceActions id={r.id} learnerName={r.learnerName} />
                )}
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{r.description}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {r.proofUrl && <ProofThumb url={r.proofUrl} />}
                {r.proofLink && (
                  <a
                    href={r.proofLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-blue-royal hover:underline"
                  >
                    <ExternalLink size={13} />
                    Lien de preuve
                  </a>
                )}
              </div>

              {r.reviewNote && (
                <div className="mt-3 rounded-xl bg-surface-secondary px-3.5 py-2.5 text-sm text-text-secondary">
                  <span className="font-semibold text-navy">Décision</span>
                  {r.reviewedByName ? ` (${r.reviewedByName})` : ""}
                  {r.reviewedAt ? ` · ${dateFmt.format(r.reviewedAt)}` : ""} : {r.reviewNote}
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
