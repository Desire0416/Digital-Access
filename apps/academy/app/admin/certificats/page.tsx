import type { Metadata } from "next";
import { Search, Award, Hash } from "lucide-react";
import type { CertificateStatus } from "@da/academy-db/client";
import { listCertificatesAdmin } from "@/lib/admin-queries";
import {
  AdminPageHeader,
  AdminCard,
  StatusPill,
  AdminEmpty,
  CERTIFICATE_STATUS_LABEL,
  CERTIFICATE_STATUS_TONE,
} from "@/components/admin/ui";
import { CertificateActions } from "./CertificateActions";

export const metadata: Metadata = { title: "Certificats — Administration" };

const TYPE_LABEL: Record<string, string> = {
  PARTICIPATION: "Participation",
  COURSE: "Formation",
  SPECIALIZATION: "Spécialisation",
  EXPERTISE: "Expertise",
  CAREER_PATH: "Parcours métier",
  SKILL_BADGE: "Badge",
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "ACTIVE", label: "Actifs" },
  { value: "REVOKED", label: "Révoqués" },
  { value: "SUSPENDED", label: "Suspendus" },
  { value: "EXPIRED", label: "Expirés" },
];

const VALID_STATUSES = new Set<CertificateStatus>(["ACTIVE", "SUSPENDED", "REVOKED", "EXPIRED", "REPLACED"]);

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminCertificatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const statusParam = one(sp.status) as CertificateStatus | undefined;
  const status = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : undefined;

  const certificates = await listCertificatesAdmin({ q, status });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Certification"
        title="Certificats"
        description="Consultez les certificats délivrés. Toute révocation exige un motif et est tracée au journal d'audit ; un certificat révoqué peut être restauré."
      />

      {/* Recherche + filtres */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form method="GET" role="search" className="relative w-full lg:max-w-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Numéro, code, titre ou apprenant…"
            aria-label="Rechercher un certificat"
            className="h-11 w-full rounded-xl border border-navy/10 bg-surface-primary pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60"
          />
        </form>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {STATUS_FILTERS.map((f) => {
            const active = (status ?? "") === f.value;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f.value) params.set("status", f.value);
            const href = `/admin/certificats${params.toString() ? `?${params}` : ""}`;
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
      </div>

      <p className="text-xs text-text-muted">
        {certificates.length} certificat{certificates.length > 1 ? "s" : ""}
        {q && <> pour « {q} »</>}
      </p>

      {certificates.length === 0 ? (
        <AdminCard>
          <AdminEmpty
            icon={<Award size={34} className="text-text-muted opacity-50" />}
            title="Aucun certificat"
            description={q ? "Aucun résultat pour cette recherche." : "Les certificats délivrés apparaîtront ici."}
          />
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {certificates.map((c) => {
            const target = c.course?.title ?? c.careerPath?.title ?? null;
            return (
              <AdminCard key={c.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-sm" aria-hidden>
                    <Award size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-display text-sm font-bold text-navy">{c.title}</p>
                      <span className="rounded-md bg-navy/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-text-secondary">
                        {TYPE_LABEL[c.type] ?? c.type}
                      </span>
                      {c.mention && (
                        <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-semibold text-accent">{c.mention}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">
                      {c.user.name} · <span className="text-text-muted">{c.user.email}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                      <span className="inline-flex items-center gap-1 font-mono"><Hash size={11} />{c.number}</span>
                      <span>Code : {c.verifyCode}</span>
                      {target && <span className="truncate">· {target}</span>}
                      <span>· Délivré le {dateFmt.format(c.issuedAt)}</span>
                      {typeof c.score === "number" && <span>· {c.score}/100</span>}
                    </div>
                    {c.status === "REVOKED" && c.revokedReason && (
                      <p className="mt-1.5 rounded-lg bg-error/[0.05] px-2.5 py-1.5 text-xs text-error">
                        Révoqué{c.revokedAt ? ` le ${dateFmt.format(c.revokedAt)}` : ""} — motif : {c.revokedReason}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <StatusPill
                      label={CERTIFICATE_STATUS_LABEL[c.status] ?? c.status}
                      tone={CERTIFICATE_STATUS_TONE[c.status] ?? "neutral"}
                    />
                    <CertificateActions certificateId={c.id} status={c.status} title={c.title} />
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
