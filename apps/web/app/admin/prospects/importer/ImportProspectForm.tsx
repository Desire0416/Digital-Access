"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  UploadCloud,
  FileText,
  Paperclip,
  Trash2,
  Building2,
  Target,
  ClipboardCheck,
  ClipboardList,
  AlertTriangle,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button, Card, Field, Input, Textarea, Loader, cn } from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { AdminPageHeader } from "@/components/admin/ui";
import {
  ORG_TYPE_VALUES,
  ORG_TYPE_LABEL,
  AUDIT_SEVERITY_VALUES,
  AUDIT_SEVERITY_LABEL,
  AUDIT_CATEGORY_VALUES,
  AUDIT_CATEGORY_LABEL,
  type OrganizationType,
  type AuditSeverity,
  type AuditCategory,
  type AssignableUser,
} from "@/lib/crm-types";
import type { ImportAnalysisResult, ImportedDocumentMeta } from "@/lib/crm-import/types";
import { createProspectFromImport } from "@/lib/crm-import-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Import de prospect par fichier (Word/PDF) — 3 étapes :
     1. Dépôt → POST /api/crm/import-prospect (analyse IA du document)
     2. Revue/correction de l'extraction (tout est éditable)
     3. Création → createProspectFromImport (organisation + prospect + audit)
   Le back-end fait toute l'analyse et la re-validation ; ici, uniquement l'UI.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Options des <select> dérivées des enums du CRM ─────────────────────────── */
const ORG_TYPE_OPTIONS: SelectOption[] = ORG_TYPE_VALUES.map((v) => ({
  value: v,
  label: ORG_TYPE_LABEL[v],
}));
const SEVERITY_OPTIONS: SelectOption[] = AUDIT_SEVERITY_VALUES.map((v) => ({
  value: v,
  label: AUDIT_SEVERITY_LABEL[v],
}));
const CATEGORY_OPTIONS: SelectOption[] = AUDIT_CATEGORY_VALUES.map((v) => ({
  value: v,
  label: AUDIT_CATEGORY_LABEL[v],
}));
const MATURITY_OPTIONS: SelectOption[] = [
  { value: "faible", label: "Faible" },
  { value: "moyenne", label: "Moyenne" },
  { value: "bonne", label: "Bonne" },
  { value: "avancée", label: "Avancée" },
];
const MATURITY_VALUES = MATURITY_OPTIONS.map((o) => o.value);

/* ── Formes locales (tous les champs en chaîne pour l'édition) ──────────────── */
interface OrgForm {
  name: string;
  legalName: string;
  organizationType: OrganizationType;
  sector: string;
  website: string;
  email: string;
  phone: string;
  city: string;
  country: string;
}
interface ProspectForm {
  mainObservedNeed: string;
  digitalMaturity: string | null;
  recommendedOffer: string;
  estimatedPotential: string;
}
interface AuditForm {
  reference: string;
  title: string;
  auditType: string;
  summary: string;
  methodology: string;
  digitalImportanceStatement: string;
  overallSeverity: AuditSeverity;
  auditDate: string;
}
interface FindingForm {
  _id: string;
  title: string;
  category: AuditCategory;
  severity: AuditSeverity;
  description: string;
  businessImpact: string;
  userImpact: string;
  recommendation: string;
  affectedPageUrl: string;
  evidenceText: string;
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyFinding(): FindingForm {
  return {
    _id: uid(),
    title: "",
    category: "UX",
    severity: "MODERATE",
    description: "",
    businessImpact: "",
    userImpact: "",
    recommendation: "",
    affectedPageUrl: "",
    evidenceText: "",
  };
}

function normalizeMaturity(v?: string): string | null {
  if (!v) return null;
  const t = v.trim().toLowerCase();
  return MATURITY_VALUES.includes(t) ? t : null;
}

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx") || name.endsWith(".pdf")) return true;
  return (
    file.type === "application/pdf" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
}

const ACCEPT = ".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function ImportProspectForm({
  assignable,
  canAssign,
  defaultAssigneeId,
}: {
  assignable: AssignableUser[];
  canAssign: boolean;
  defaultAssigneeId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  // Phase de l'assistant
  const [phase, setPhase] = React.useState<"upload" | "review">("upload");

  // Étape 1 — dépôt / analyse
  const [dragging, setDragging] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Étape 2 — extraction éditable
  const [docMeta, setDocMeta] = React.useState<ImportedDocumentMeta | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [org, setOrg] = React.useState<OrgForm | null>(null);
  const [prospect, setProspect] = React.useState<ProspectForm | null>(null);
  const [audit, setAudit] = React.useState<AuditForm | null>(null);
  const [findings, setFindings] = React.useState<FindingForm[]>([]);
  const [assigneeId, setAssigneeId] = React.useState<string>(defaultAssigneeId);

  // Étape 3 — retours serveur
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const assignableOptions: SelectOption[] = assignable.map((u) => ({ value: u.id, label: u.name }));
  const fe = (key: string): string | undefined => fieldErrors[key];

  /* ── Analyse du document ──────────────────────────────────────────────── */
  const analyze = React.useCallback(async (file: File) => {
    setUploadError(null);
    if (!isAcceptedFile(file)) {
      setUploadError("Format non pris en charge. Déposez un fichier Word (.docx) ou PDF.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("Fichier trop lourd (20 Mo maximum).");
      return;
    }
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/crm/import-prospect", { method: "POST", body: fd });
      const data = (await res.json()) as
        | ImportAnalysisResult
        | { error?: string; code?: string };

      if (!res.ok || !("extraction" in data)) {
        const err = data as { error?: string; code?: string };
        if (err.code === "AI_KEY_MISSING") {
          setUploadError(
            "L'analyse par IA n'est pas configurée sur le serveur (variable ANTHROPIC_API_KEY manquante). Contactez un administrateur.",
          );
        } else {
          setUploadError(err.error ?? "L'analyse du document a échoué. Réessayez.");
        }
        return;
      }

      hydrate(data);
    } catch {
      setUploadError("Impossible d'analyser le document. Vérifiez votre connexion et réessayez.");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  function hydrate(result: ImportAnalysisResult) {
    const e = result.extraction;
    setDocMeta(result.document);
    setWarnings(result.warnings ?? []);
    setOrg({
      name: e.organization.name ?? "",
      legalName: e.organization.legalName ?? "",
      organizationType: e.organization.organizationType,
      sector: e.organization.sector ?? "",
      website: e.organization.website ?? "",
      email: e.organization.email ?? "",
      phone: e.organization.phone ?? "",
      city: e.organization.city ?? "",
      country: e.organization.country ?? "",
    });
    setProspect({
      mainObservedNeed: e.prospect.mainObservedNeed ?? "",
      digitalMaturity: normalizeMaturity(e.prospect.digitalMaturity),
      recommendedOffer: e.prospect.recommendedOffer ?? "",
      estimatedPotential:
        e.prospect.estimatedPotential != null ? String(e.prospect.estimatedPotential) : "",
    });
    setAudit({
      reference: e.audit.reference ?? "",
      title: e.audit.title ?? "",
      auditType: e.audit.auditType ?? "",
      summary: e.audit.summary ?? "",
      methodology: e.audit.methodology ?? "",
      digitalImportanceStatement: e.audit.digitalImportanceStatement ?? "",
      overallSeverity: e.audit.overallSeverity,
      auditDate: e.audit.auditDate ?? "",
    });
    setFindings(
      (e.audit.findings ?? []).map((f) => ({
        _id: uid(),
        title: f.title ?? "",
        category: f.category,
        severity: f.severity,
        description: f.description ?? "",
        businessImpact: f.businessImpact ?? "",
        userImpact: f.userImpact ?? "",
        recommendation: f.recommendation ?? "",
        affectedPageUrl: f.affectedPageUrl ?? "",
        evidenceText: f.evidenceText ?? "",
      })),
    );
    setFormError(null);
    setFieldErrors({});
    setPhase("review");
  }

  const onDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    setDragging(false);
    if (analyzing) return;
    const file = ev.dataTransfer.files?.[0];
    if (file) void analyze(file);
  };

  const openPicker = () => inputRef.current?.click();

  /* ── Édition des constats ─────────────────────────────────────────────── */
  function updateFinding(id: string, patch: Partial<FindingForm>) {
    setFindings((prev) => prev.map((f) => (f._id === id ? { ...f, ...patch } : f)));
  }
  function removeFinding(id: string) {
    setFindings((prev) => prev.filter((f) => f._id !== id));
  }

  /* ── Recommencer ──────────────────────────────────────────────────────── */
  function reset() {
    setPhase("upload");
    setUploadError(null);
    setDocMeta(null);
    setWarnings([]);
    setOrg(null);
    setProspect(null);
    setAudit(null);
    setFindings([]);
    setFormError(null);
    setFieldErrors({});
  }

  /* ── Création ─────────────────────────────────────────────────────────── */
  function handleCreate() {
    if (isPending || !org || !prospect || !audit) return;

    const errs: Record<string, string> = {};
    if (!org.name.trim()) errs["organization.name"] = "Le nom de l'organisation est requis.";
    if (!audit.title.trim()) errs["audit.title"] = "Le titre de l'audit est requis.";
    setFieldErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length > 0) return;

    const potentialRaw = prospect.estimatedPotential.trim();
    const potentialNum = potentialRaw === "" ? undefined : Number(potentialRaw);

    const payload = {
      organization: {
        name: org.name.trim(),
        legalName: org.legalName.trim() || undefined,
        organizationType: org.organizationType,
        sector: org.sector.trim() || undefined,
        website: org.website.trim() || undefined,
        email: org.email.trim() || undefined,
        phone: org.phone.trim() || undefined,
        city: org.city.trim() || undefined,
        country: org.country.trim() || undefined,
      },
      prospect: {
        mainObservedNeed: prospect.mainObservedNeed.trim() || undefined,
        digitalMaturity: prospect.digitalMaturity ?? undefined,
        recommendedOffer: prospect.recommendedOffer.trim() || undefined,
        estimatedPotential:
          potentialNum !== undefined && Number.isFinite(potentialNum) ? potentialNum : undefined,
      },
      audit: {
        reference: audit.reference.trim() || undefined,
        title: audit.title.trim(),
        auditType: audit.auditType.trim() || undefined,
        summary: audit.summary.trim() || undefined,
        methodology: audit.methodology.trim() || undefined,
        digitalImportanceStatement: audit.digitalImportanceStatement.trim() || undefined,
        overallSeverity: audit.overallSeverity,
        auditDate: audit.auditDate.trim() || undefined,
        findings: findings.map((f) => ({
          title: f.title.trim(),
          category: f.category,
          severity: f.severity,
          description: f.description.trim() || undefined,
          businessImpact: f.businessImpact.trim() || undefined,
          userImpact: f.userImpact.trim() || undefined,
          recommendation: f.recommendation.trim() || undefined,
          affectedPageUrl: f.affectedPageUrl.trim() || undefined,
          evidenceText: f.evidenceText.trim() || undefined,
        })),
      },
      document: docMeta ?? undefined,
      assignedToId: canAssign ? assigneeId || undefined : undefined,
    };

    startTransition(async () => {
      const res = await createProspectFromImport(payload);
      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      router.push(`/admin/prospects/${res.prospectId}`);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      <AdminPageHeader
        title="Importer un prospect"
        description="Déposez un rapport d'audit (Word ou PDF) : l'IA en extrait le prospect, que vous relisez avant création."
      />

      <AnimatePresence mode="wait">
        {phase === "upload" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <UploadStep
              dragging={dragging}
              analyzing={analyzing}
              uploadError={uploadError}
              inputRef={inputRef}
              onOpenPicker={openPicker}
              onDrop={onDrop}
              onDragOver={(ev) => {
                ev.preventDefault();
                if (!analyzing) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onFile={(file) => void analyze(file)}
            />
          </motion.div>
        ) : (
          org &&
          prospect &&
          audit && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {/* Fichier joint */}
              {docMeta && (
                <div className="flex items-center gap-3 rounded-2xl border border-brand-blue-vif/20 bg-brand-blue-vif/[0.05] px-4 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand-blue-royal shadow-sm">
                    <Paperclip size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{docMeta.fileName}</p>
                    <p className="text-xs text-text-muted">
                      Document analysé{docMeta.size ? ` · ${formatBytes(docMeta.size)}` : ""} — rattaché à l'audit créé.
                    </p>
                  </div>
                </div>
              )}

              {/* Avertissements non bloquants */}
              {warnings.length > 0 && (
                <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning/20 text-[#B45309]">
                      <AlertTriangle size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-[#B45309]">
                        À vérifier avant de créer
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                        {warnings.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Erreur globale de création */}
              {formError && (
                <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error">
                  {formError}
                </div>
              )}

              {/* (a) Organisation */}
              <SectionCard
                icon={<Building2 size={18} />}
                tone="violet"
                title="Organisation"
                subtitle="La structure identifiée dans le document."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Nom de l'organisation"
                    htmlFor="org-name"
                    required
                    error={fe("organization.name")}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="org-name"
                      value={org.name}
                      onChange={(ev) => setOrg({ ...org, name: ev.target.value })}
                      error={!!fe("organization.name")}
                      placeholder="Ex. Boutique Élégance"
                    />
                  </Field>

                  <Field label="Raison sociale" htmlFor="org-legal" error={fe("organization.legalName")}>
                    <Input
                      id="org-legal"
                      value={org.legalName}
                      onChange={(ev) => setOrg({ ...org, legalName: ev.target.value })}
                      error={!!fe("organization.legalName")}
                      placeholder="Ex. Élégance SARL"
                    />
                  </Field>

                  <Field label="Type d'organisation" error={fe("organization.organizationType")}>
                    <Select
                      value={org.organizationType}
                      onChange={(v) => setOrg({ ...org, organizationType: v as OrganizationType })}
                      options={ORG_TYPE_OPTIONS}
                      ariaLabel="Type d'organisation"
                    />
                  </Field>

                  <Field label="Secteur d'activité" htmlFor="org-sector" error={fe("organization.sector")}>
                    <Input
                      id="org-sector"
                      value={org.sector}
                      onChange={(ev) => setOrg({ ...org, sector: ev.target.value })}
                      error={!!fe("organization.sector")}
                      placeholder="Ex. Mode & textile"
                    />
                  </Field>

                  <Field label="Ville" htmlFor="org-city" error={fe("organization.city")}>
                    <Input
                      id="org-city"
                      value={org.city}
                      onChange={(ev) => setOrg({ ...org, city: ev.target.value })}
                      error={!!fe("organization.city")}
                      placeholder="Ex. Abidjan"
                    />
                  </Field>

                  <Field label="Site web" htmlFor="org-website" error={fe("organization.website")}>
                    <Input
                      id="org-website"
                      value={org.website}
                      onChange={(ev) => setOrg({ ...org, website: ev.target.value })}
                      error={!!fe("organization.website")}
                      placeholder="https://exemple.ci"
                    />
                  </Field>

                  <Field label="Email" htmlFor="org-email" error={fe("organization.email")}>
                    <Input
                      id="org-email"
                      type="email"
                      value={org.email}
                      onChange={(ev) => setOrg({ ...org, email: ev.target.value })}
                      error={!!fe("organization.email")}
                      placeholder="contact@exemple.ci"
                    />
                  </Field>

                  <Field label="Téléphone" htmlFor="org-phone" error={fe("organization.phone")}>
                    <Input
                      id="org-phone"
                      type="tel"
                      value={org.phone}
                      onChange={(ev) => setOrg({ ...org, phone: ev.target.value })}
                      error={!!fe("organization.phone")}
                      placeholder="+225 07 00 00 00 00"
                    />
                  </Field>

                  <Field label="Pays" htmlFor="org-country" error={fe("organization.country")}>
                    <Input
                      id="org-country"
                      value={org.country}
                      onChange={(ev) => setOrg({ ...org, country: ev.target.value })}
                      error={!!fe("organization.country")}
                      placeholder="Côte d'Ivoire"
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* (b) Prospect */}
              <SectionCard
                icon={<Target size={18} />}
                tone="cyan"
                title="Qualification"
                subtitle="Besoin observé et potentiel commercial."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Besoin principal observé"
                    htmlFor="p-need"
                    error={fe("prospect.mainObservedNeed")}
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id="p-need"
                      value={prospect.mainObservedNeed}
                      onChange={(ev) => setProspect({ ...prospect, mainObservedNeed: ev.target.value })}
                      error={!!fe("prospect.mainObservedNeed")}
                      placeholder="Synthèse du besoin numérique constaté."
                    />
                  </Field>

                  <Field label="Maturité numérique" error={fe("prospect.digitalMaturity")}>
                    <Select
                      value={prospect.digitalMaturity}
                      onChange={(v) => setProspect({ ...prospect, digitalMaturity: v })}
                      options={MATURITY_OPTIONS}
                      placeholder="Non évaluée"
                      ariaLabel="Maturité numérique"
                    />
                  </Field>

                  <Field
                    label="Potentiel estimé (FCFA)"
                    htmlFor="p-potential"
                    hint="Budget approximatif mobilisable."
                    error={fe("prospect.estimatedPotential")}
                  >
                    <Input
                      id="p-potential"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1000}
                      value={prospect.estimatedPotential}
                      onChange={(ev) => setProspect({ ...prospect, estimatedPotential: ev.target.value })}
                      error={!!fe("prospect.estimatedPotential")}
                      placeholder="Ex. 500000"
                    />
                  </Field>

                  <Field
                    label="Offre recommandée"
                    htmlFor="p-offer"
                    error={fe("prospect.recommendedOffer")}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="p-offer"
                      value={prospect.recommendedOffer}
                      onChange={(ev) => setProspect({ ...prospect, recommendedOffer: ev.target.value })}
                      error={!!fe("prospect.recommendedOffer")}
                      placeholder="Ex. Pack Site vitrine + maintenance"
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* (c) Audit */}
              <SectionCard
                icon={<ClipboardCheck size={18} />}
                tone="blue"
                title="Audit"
                subtitle="En-tête du rapport d'audit."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Titre de l'audit"
                    htmlFor="a-title"
                    required
                    error={fe("audit.title")}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="a-title"
                      value={audit.title}
                      onChange={(ev) => setAudit({ ...audit, title: ev.target.value })}
                      error={!!fe("audit.title")}
                      placeholder="Ex. Audit de présence numérique — Boutique Élégance"
                    />
                  </Field>

                  <Field label="Référence" htmlFor="a-ref" hint="Laissez vide pour générer automatiquement." error={fe("audit.reference")}>
                    <Input
                      id="a-ref"
                      value={audit.reference}
                      onChange={(ev) => setAudit({ ...audit, reference: ev.target.value })}
                      error={!!fe("audit.reference")}
                      placeholder="Ex. DA-AUD-2026-001"
                    />
                  </Field>

                  <Field label="Type d'audit" htmlFor="a-type" error={fe("audit.auditType")}>
                    <Input
                      id="a-type"
                      value={audit.auditType}
                      onChange={(ev) => setAudit({ ...audit, auditType: ev.target.value })}
                      error={!!fe("audit.auditType")}
                      placeholder="Ex. Audit complet"
                    />
                  </Field>

                  <Field label="Gravité globale" error={fe("audit.overallSeverity")}>
                    <Select
                      value={audit.overallSeverity}
                      onChange={(v) => setAudit({ ...audit, overallSeverity: v as AuditSeverity })}
                      options={SEVERITY_OPTIONS}
                      ariaLabel="Gravité globale"
                    />
                  </Field>

                  <Field label="Date de l'audit" htmlFor="a-date" error={fe("audit.auditDate")}>
                    <Input
                      id="a-date"
                      type="date"
                      value={audit.auditDate}
                      onChange={(ev) => setAudit({ ...audit, auditDate: ev.target.value })}
                      error={!!fe("audit.auditDate")}
                    />
                  </Field>

                  <Field label="Synthèse" htmlFor="a-summary" error={fe("audit.summary")} className="sm:col-span-2">
                    <Textarea
                      id="a-summary"
                      value={audit.summary}
                      onChange={(ev) => setAudit({ ...audit, summary: ev.target.value })}
                      error={!!fe("audit.summary")}
                      placeholder="Résumé exécutif de l'audit."
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* (d) Constats */}
              <Card className="p-5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-warning/15 text-[#B45309]">
                      <ClipboardList size={18} />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-bold text-navy">
                        Constats{" "}
                        <span className="text-sm font-semibold text-text-muted">({findings.length})</span>
                      </h2>
                      <p className="text-xs text-text-secondary">
                        Les problèmes relevés dans le rapport. Ajoutez, modifiez ou supprimez.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFindings((prev) => [...prev, emptyFinding()])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-blue-vif/40 px-3 py-2 text-sm font-semibold text-brand-blue-royal transition-colors hover:bg-brand-blue-vif/[0.06]"
                  >
                    <Plus size={15} /> Ajouter un constat
                  </button>
                </div>

                {findings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-navy/15 bg-surface-secondary/50 px-4 py-8 text-center text-sm text-text-secondary">
                    Aucun constat extrait. Ajoutez-en un si nécessaire.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {findings.map((f, i) => (
                        <motion.div
                          key={f._id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          whileHover={{ y: -1 }}
                          className="rounded-xl border border-navy/[0.08] bg-surface-secondary/40 p-4 transition-shadow hover:shadow-md"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                              <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-da text-[11px] font-extrabold text-white">
                                {i + 1}
                              </span>
                              Constat
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFinding(f._id)}
                              aria-label="Supprimer ce constat"
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                            >
                              <Trash2 size={14} /> Supprimer
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field
                              label="Titre du constat"
                              required
                              error={fe(`audit.findings.${i}.title`)}
                              className="sm:col-span-2"
                            >
                              <Input
                                value={f.title}
                                onChange={(ev) => updateFinding(f._id, { title: ev.target.value })}
                                error={!!fe(`audit.findings.${i}.title`)}
                                placeholder="Ex. Site non responsive sur mobile"
                              />
                            </Field>

                            <Field label="Catégorie" error={fe(`audit.findings.${i}.category`)}>
                              <Select
                                value={f.category}
                                onChange={(v) => updateFinding(f._id, { category: v as AuditCategory })}
                                options={CATEGORY_OPTIONS}
                                ariaLabel="Catégorie du constat"
                              />
                            </Field>

                            <Field label="Gravité" error={fe(`audit.findings.${i}.severity`)}>
                              <Select
                                value={f.severity}
                                onChange={(v) => updateFinding(f._id, { severity: v as AuditSeverity })}
                                options={SEVERITY_OPTIONS}
                                ariaLabel="Gravité du constat"
                              />
                            </Field>

                            <Field
                              label="Recommandation"
                              error={fe(`audit.findings.${i}.recommendation`)}
                              className="sm:col-span-2"
                            >
                              <Textarea
                                value={f.recommendation}
                                onChange={(ev) => updateFinding(f._id, { recommendation: ev.target.value })}
                                error={!!fe(`audit.findings.${i}.recommendation`)}
                                placeholder="Action corrective recommandée."
                              />
                            </Field>

                            <Field
                              label="URL concernée"
                              error={fe(`audit.findings.${i}.affectedPageUrl`)}
                              className="sm:col-span-2"
                            >
                              <Input
                                value={f.affectedPageUrl}
                                onChange={(ev) => updateFinding(f._id, { affectedPageUrl: ev.target.value })}
                                error={!!fe(`audit.findings.${i}.affectedPageUrl`)}
                                placeholder="https://exemple.ci/page"
                              />
                            </Field>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </Card>

              {/* Attribution */}
              {canAssign && (
                <Card className="p-5 sm:p-6">
                  <Field
                    label="Responsable"
                    hint="Commercial en charge du suivi de ce prospect."
                    error={fe("assignedToId")}
                    className="sm:max-w-sm"
                  >
                    <Select
                      value={assigneeId || null}
                      onChange={(v) => setAssigneeId(v)}
                      options={assignableOptions}
                      placeholder="Sélectionner un responsable…"
                      ariaLabel="Responsable"
                    />
                  </Field>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={reset}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy disabled:opacity-50"
                >
                  <RotateCcw size={15} /> Recommencer
                </button>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/admin/prospects"
                    className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
                  >
                    Annuler
                  </Link>
                  <Button
                    type="button"
                    variant="primary"
                    loading={isPending}
                    disabled={isPending}
                    onClick={handleCreate}
                  >
                    Créer le prospect
                  </Button>
                </div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Étape 1 : zone de dépôt ────────────────────────────────────────────────── */
function UploadStep({
  dragging,
  analyzing,
  uploadError,
  inputRef,
  onOpenPicker,
  onDrop,
  onDragOver,
  onDragLeave,
  onFile,
}: {
  dragging: boolean;
  analyzing: boolean;
  uploadError: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onOpenPicker: () => void;
  onDrop: (ev: React.DragEvent) => void;
  onDragOver: (ev: React.DragEvent) => void;
  onDragLeave: () => void;
  onFile: (file: File) => void;
}) {
  return (
    <Card className="p-5 sm:p-8">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(ev) => {
          const file = ev.target.files?.[0];
          if (file) onFile(file);
          ev.target.value = "";
        }}
      />

      {analyzing ? (
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <Loader size={72} label="Analyse du document par l'IA…" />
          <div className="max-w-sm text-center">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy">
              <Sparkles size={15} className="text-brand-violet" /> Extraction en cours
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              L'IA lit le rapport et en extrait l'organisation, la qualification et les constats.
              Cela peut prendre quelques dizaines de secondes — ne fermez pas cette page.
            </p>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onOpenPicker}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
              dragging
                ? "border-brand-blue-vif bg-brand-blue-vif/[0.06]"
                : "border-navy/15 bg-surface-secondary/50 hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.03]",
            )}
          >
            <motion.span
              animate={dragging ? { scale: 1.1, y: -3 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand"
            >
              <UploadCloud size={26} />
            </motion.span>
            <div>
              <p className="font-display text-base font-bold text-navy">
                {dragging ? "Déposez le document ici" : "Glissez le rapport d'audit ou cliquez pour parcourir"}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Fichier Word (.docx) ou PDF — 20 Mo maximum
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white shadow-brand">
              <FileText size={15} /> Choisir un fichier
            </span>
          </button>

          <AnimatePresence>
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{uploadError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </Card>
  );
}

/* ── Carte de section réutilisable ──────────────────────────────────────────── */
function SectionCard({
  icon,
  tone,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  tone: "violet" | "cyan" | "blue";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "violet"
      ? "bg-brand-violet/10 text-brand-violet"
      : tone === "cyan"
        ? "bg-brand-cyan/15 text-[#0891a6]"
        : "bg-brand-blue-royal/10 text-brand-blue-royal";

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className={cn("grid h-10 w-10 place-items-center rounded-xl", toneClass)}>{icon}</span>
        <div>
          <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          <p className="text-xs text-text-secondary">{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}
