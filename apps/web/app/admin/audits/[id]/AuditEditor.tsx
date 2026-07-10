"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, User, FileText, Info, ListChecks, Paperclip, Send,
  CheckCircle2, XCircle, Archive, AlertTriangle, Plus, Pencil, Trash2,
  ChevronUp, ChevronDown, Lock, ExternalLink, Download, UploadCloud, EyeOff,
  Globe, CalendarClock,
} from "lucide-react";
import {
  Button, Card, Field, Input, Textarea, cn, formatDate, GradientText,
  StaggerGroup, StaggerItem,
} from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { StatusPill, EmptyState } from "@/components/admin/ui";
import { TabBar, type TabDef } from "@/components/admin/Tabs";
import { Modal } from "@/components/admin/Modal";
import type {
  AuditDetail, AuditFindingItem, AuditSeverity, AuditCategory,
  AuditDocType, DocVisibility, Tone,
} from "@/lib/crm-types";
import {
  AUDIT_STATUS_LABEL, AUDIT_STATUS_TONE,
  AUDIT_SEVERITY_VALUES, AUDIT_SEVERITY_LABEL, AUDIT_SEVERITY_TONE,
  AUDIT_CATEGORY_VALUES, AUDIT_CATEGORY_LABEL,
  DOC_TYPE_VALUES, DOC_TYPE_LABEL, DOC_VISIBILITY_VALUES, DOC_VISIBILITY_LABEL,
} from "@/lib/crm-types";
import {
  updateAudit, addFinding, updateFinding, deleteFinding, reorderFindings,
  submitAudit, reviewAudit, sendAudit, archiveAudit,
  addAuditDocument, deleteAuditDocument,
} from "@/lib/crm-audit-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Éditeur d'audit complet — CRM commercial. En-tête (statut/gravité/version +
   barre d'actions workflow), puis onglets Informations / Constats / Documents.
   `audit.editable` commande le mode lecture seule (Infos & Constats). Chaque
   mutation : useTransition, désactivation pendant pending, erreurs inline,
   router.refresh() au succès + fermeture des modales.
   ══════════════════════════════════════════════════════════════════════════ */

const UPLOAD_URL = "/api/crm/audit-upload";
const UPLOAD_ACCEPT = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp";

const SEVERITY_NONE_OPTIONS: SelectOption[] = [
  { value: "", label: "—" },
  ...AUDIT_SEVERITY_VALUES.map((v) => ({ value: v, label: AUDIT_SEVERITY_LABEL[v] })),
];
const SEVERITY_OPTIONS: SelectOption[] = AUDIT_SEVERITY_VALUES.map((v) => ({
  value: v, label: AUDIT_SEVERITY_LABEL[v],
}));
const CATEGORY_OPTIONS: SelectOption[] = AUDIT_CATEGORY_VALUES.map((v) => ({
  value: v, label: AUDIT_CATEGORY_LABEL[v],
}));
const DOC_TYPE_OPTIONS: SelectOption[] = DOC_TYPE_VALUES.map((v) => ({
  value: v, label: DOC_TYPE_LABEL[v],
}));
const DOC_VISIBILITY_OPTIONS: SelectOption[] = DOC_VISIBILITY_VALUES.map((v) => ({
  value: v, label: DOC_VISIBILITY_LABEL[v],
}));

function visibilityTone(v: DocVisibility): Tone {
  if (v === "INTERNAL_ONLY") return "red";
  if (v === "COMMERCIAL_TEAM") return "amber";
  return "green";
}

function formatBytes(size: number | null): string {
  if (size == null) return "—";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function safeHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

type TabId = "infos" | "findings" | "documents";

/* ─── Bloc d'erreur inline réutilisable ─────────────────────────────────────── */
function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error">
      {message}
    </div>
  );
}

/* Petit spinner brandé (jamais générique) pour boutons/upload. */
function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

/* ══════════════════════════════ COMPOSANT PRINCIPAL ════════════════════════ */

export function AuditEditor({
  audit, canValidate, canSend, canSubmit, canEditDocs,
}: {
  audit: AuditDetail;
  canValidate: boolean;
  canSend: boolean;
  canSubmit: boolean;
  canEditDocs: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabId>("infos");
  const [isPending, startTransition] = React.useTransition();
  const [headerError, setHeaderError] = React.useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectNote, setRejectNote] = React.useState("");
  const [rejectFieldError, setRejectFieldError] = React.useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [recipientId, setRecipientId] = React.useState<string>(audit.recipientContact?.id ?? "");

  const backHref = audit.prospectId ? `/admin/prospects/${audit.prospectId}` : "/admin/audits";

  const showSubmit = audit.editable && canSubmit;
  const showReview = audit.status === "TO_VALIDATE" && canValidate;
  const showSend = (audit.status === "VALIDATED" || audit.status === "READY_TO_SEND") && canSend;
  const showArchive = audit.status !== "ARCHIVED";

  function handleSubmitAudit() {
    setHeaderError(null);
    startTransition(async () => {
      const res = await submitAudit({ id: audit.id });
      if (!res.ok) { setHeaderError(res.error); return; }
      router.refresh();
    });
  }

  function handleValidate() {
    setHeaderError(null);
    startTransition(async () => {
      const res = await reviewAudit({ id: audit.id, decision: "validate" });
      if (!res.ok) { setHeaderError(res.error); return; }
      router.refresh();
    });
  }

  function handleReject() {
    setRejectFieldError(null);
    if (!rejectNote.trim()) { setRejectFieldError("Motif requis."); return; }
    startTransition(async () => {
      const res = await reviewAudit({ id: audit.id, decision: "reject", note: rejectNote.trim() });
      if (!res.ok) {
        setRejectFieldError(res.fieldErrors?.note ?? res.error);
        return;
      }
      setRejectOpen(false);
      setRejectNote("");
      router.refresh();
    });
  }

  function handleSend() {
    setHeaderError(null);
    startTransition(async () => {
      const res = await sendAudit({ id: audit.id, recipientContactId: recipientId === "" ? null : recipientId });
      if (!res.ok) { setHeaderError(res.error); return; }
      router.refresh();
    });
  }

  function handleArchive() {
    setHeaderError(null);
    startTransition(async () => {
      const res = await archiveAudit({ id: audit.id });
      if (!res.ok) { setHeaderError(res.error); setArchiveOpen(false); return; }
      router.push(backHref);
    });
  }

  const recipientOptions: SelectOption[] = [
    { value: "", label: "Aucun destinataire" },
    ...audit.contacts.map((c) => ({ value: c.id, label: c.fullName })),
  ];

  const tabs: TabDef[] = [
    { id: "infos", label: "Informations", icon: Info },
    { id: "findings", label: "Constats", icon: ListChecks, badge: audit.findings.length },
    { id: "documents", label: "Documents", icon: Paperclip, badge: audit.documents.length },
  ];

  return (
    <div>
      {/* Retour */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
      >
        <ArrowLeft size={16} /> {audit.prospectId ? "Fiche prospect" : "Audits"}
      </Link>

      {/* En-tête */}
      <div className="mt-4 border-b border-navy/[0.08] pb-6">
        <GradientText className="text-xs font-bold uppercase tracking-wider">
          Éditeur d'audit
        </GradientText>

        <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-navy/[0.05] px-2 py-0.5 font-mono text-xs font-semibold text-text-secondary">
                <FileText size={12} /> {audit.reference}
              </span>
              <span className="text-xs font-medium text-text-muted">v{audit.version}</span>
            </div>
            <h1 className="mt-1.5 break-words font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {audit.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={14} className="text-text-muted" /> {audit.organization.name}
              </span>
              {audit.author && (
                <>
                  <span className="text-text-muted">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <User size={14} className="text-text-muted" /> {audit.author.name}
                  </span>
                </>
              )}
              {audit.validatedByName && audit.validatedAt && (
                <>
                  <span className="text-text-muted">•</span>
                  <span>Validé par {audit.validatedByName} le {formatDate(audit.validatedAt)}</span>
                </>
              )}
              {audit.sentByName && audit.sentAt && (
                <>
                  <span className="text-text-muted">•</span>
                  <span>Envoyé par {audit.sentByName} le {formatDate(audit.sentAt)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <StatusPill label={AUDIT_STATUS_LABEL[audit.status]} tone={AUDIT_STATUS_TONE[audit.status]} />
            {audit.overallSeverity && (
              <StatusPill
                label={`Gravité : ${AUDIT_SEVERITY_LABEL[audit.overallSeverity]}`}
                tone={AUDIT_SEVERITY_TONE[audit.overallSeverity]}
              />
            )}
          </div>
        </div>

        {/* Bandeau corrections demandées */}
        {audit.reviewNote && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3">
            <span className="mt-0.5 shrink-0 text-error"><AlertTriangle size={18} /></span>
            <p className="min-w-0 break-words text-sm text-error">
              <span className="font-bold">Corrections demandées :</span> {audit.reviewNote}
            </p>
          </div>
        )}

        {/* Barre d'actions workflow */}
        {(showSubmit || showReview || showSend || showArchive) && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {showSubmit && (
                <Button type="button" variant="primary" size="md" onClick={handleSubmitAudit} loading={isPending} disabled={isPending}>
                  <Send size={16} /> Soumettre à validation
                </Button>
              )}
              {showReview && (
                <>
                  <Button type="button" variant="primary" size="md" onClick={handleValidate} disabled={isPending}>
                    <CheckCircle2 size={16} /> Valider
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => { setRejectFieldError(null); setRejectOpen(true); }}
                    disabled={isPending}
                    className="border-error/30 text-error hover:border-error/60 hover:text-error"
                  >
                    <XCircle size={16} /> Refuser
                  </Button>
                </>
              )}
              {showArchive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setArchiveOpen(true)}
                  disabled={isPending}
                  className="text-text-secondary hover:text-error"
                >
                  <Archive size={16} /> Archiver
                </Button>
              )}
            </div>

            {/* Zone d'envoi */}
            {showSend && (
              <Card interactive={false} className="p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-da text-white">
                    <Send size={16} />
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold text-navy">Envoyer l'audit</h2>
                    <p className="text-xs text-text-secondary">Marquez l'audit comme transmis au prospect.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 block text-xs font-medium text-text-muted">Destinataire</span>
                    <Select
                      value={recipientId}
                      onChange={setRecipientId}
                      options={recipientOptions}
                      disabled={isPending}
                      ariaLabel="Destinataire de l'audit"
                    />
                  </div>
                  <Button type="button" variant="primary" size="md" onClick={handleSend} loading={isPending} disabled={isPending}>
                    Marquer comme envoyé
                  </Button>
                </div>
              </Card>
            )}

            <FormError message={headerError} />
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="mt-6">
        <TabBar tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} layoutGroupId="audit-tab" />
      </div>

      <div className="mt-6">
        {tab === "infos" && <InfosTab audit={audit} editable={audit.editable} />}
        {tab === "findings" && <FindingsTab audit={audit} editable={audit.editable} />}
        {tab === "documents" && <DocumentsTab audit={audit} canEditDocs={canEditDocs} />}
      </div>

      {/* Modale refus */}
      <Modal
        open={rejectOpen}
        onClose={() => { if (!isPending) setRejectOpen(false); }}
        title="Refuser l'audit"
        description="Indiquez les corrections attendues. L'auteur sera notifié."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setRejectOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-error px-6 text-[0.95rem] font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-50"
            >
              {isPending && <Spinner />}
              Refuser l'audit
            </button>
          </div>
        }
      >
        <Field label="Motif du refus" htmlFor="reject-note" required error={rejectFieldError ?? undefined}>
          <Textarea
            id="reject-note"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            error={!!rejectFieldError}
            placeholder="Ex. Reformuler le résumé, préciser les recommandations du constat #2…"
          />
        </Field>
      </Modal>

      {/* Modale archivage */}
      <Modal
        open={archiveOpen}
        onClose={() => { if (!isPending) setArchiveOpen(false); }}
        title="Archiver cet audit ?"
        description="Il sera retiré du suivi actif. Cette action ne peut pas être annulée depuis l'interface."
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setArchiveOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-error px-6 text-[0.95rem] font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-50"
            >
              {isPending && <Spinner />}
              Archiver l'audit
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-[#B45309]">
            <AlertTriangle size={18} />
          </span>
          <p className="text-sm text-text-secondary">
            L'audit <span className="font-semibold text-navy">{audit.reference}</span> sera marqué comme
            archivé et quittera la liste des audits actifs.
          </p>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════ ONGLET INFORMATIONS ═══════════════════════ */

function ReadField({ label, children }: { label: string; children: React.ReactNode }) {
  const empty = children == null || children === "";
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <div className="mt-1 whitespace-pre-wrap break-words text-sm text-navy">
        {empty ? <span className="text-text-muted">—</span> : children}
      </div>
    </div>
  );
}

function InfosTab({ audit, editable }: { audit: AuditDetail; editable: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string>>({});
  const [saved, setSaved] = React.useState(false);

  const [title, setTitle] = React.useState(audit.title);
  const [auditType, setAuditType] = React.useState(audit.auditType ?? "");
  const [auditDate, setAuditDate] = React.useState(audit.auditDate?.slice(0, 10) ?? "");
  const [severity, setSeverity] = React.useState<string>(audit.overallSeverity ?? "");
  const [summary, setSummary] = React.useState(audit.summary ?? "");
  const [methodology, setMethodology] = React.useState(audit.methodology ?? "");
  const [digitalStatement, setDigitalStatement] = React.useState(audit.digitalImportanceStatement ?? "");
  const [internalNotes, setInternalNotes] = React.useState(audit.internalNotes ?? "");

  function touched<T>(setter: (v: T) => void) {
    return (v: T) => { setSaved(false); setter(v); };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending || !title.trim()) return;
    setError(null);
    setFe({});
    startTransition(async () => {
      const res = await updateAudit({
        id: audit.id,
        title: title.trim(),
        auditType: auditType.trim(),
        auditDate,
        overallSeverity: severity === "" ? null : (severity as AuditSeverity),
        summary: summary.trim(),
        methodology: methodology.trim(),
        digitalImportanceStatement: digitalStatement.trim(),
        internalNotes: internalNotes.trim(),
      });
      if (!res.ok) {
        setError(res.error);
        if (res.fieldErrors) setFe(res.fieldErrors);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  /* ── Lecture seule ── */
  if (!editable) {
    return (
      <Card interactive={false} className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
          <span className="mt-0.5 shrink-0 text-[#B45309]"><Lock size={16} /></span>
          <p className="text-sm font-medium text-[#B45309]">
            Audit verrouillé (soumis / validé). Le contenu n'est plus modifiable.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ReadField label="Titre">{audit.title}</ReadField>
          <ReadField label="Type d'audit">{audit.auditType}</ReadField>
          <ReadField label="Date de l'audit">{audit.auditDate ? formatDate(audit.auditDate) : ""}</ReadField>
          <ReadField label="Gravité globale">
            {audit.overallSeverity ? (
              <StatusPill
                label={AUDIT_SEVERITY_LABEL[audit.overallSeverity]}
                tone={AUDIT_SEVERITY_TONE[audit.overallSeverity]}
              />
            ) : ""}
          </ReadField>
        </div>

        <div className="mt-5 space-y-5 border-t border-navy/[0.06] pt-5">
          <ReadField label="Résumé">{audit.summary}</ReadField>
          <ReadField label="Méthodologie">{audit.methodology}</ReadField>
          <ReadField label="Nécessité du numérique à notre ère">{audit.digitalImportanceStatement}</ReadField>
          <ReadField label="Notes internes">{audit.internalNotes}</ReadField>
        </div>
      </Card>
    );
  }

  /* ── Édition ── */
  return (
    <Card interactive={false} className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormError message={error} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Titre de l'audit" htmlFor="a-title" required error={fe.title} className="sm:col-span-2">
            <Input id="a-title" value={title} onChange={(e) => touched(setTitle)(e.target.value)} error={!!fe.title} placeholder="Ex. Audit de présence numérique" disabled={isPending} />
          </Field>

          <Field label="Type d'audit" htmlFor="a-type" error={fe.auditType}>
            <Input id="a-type" value={auditType} onChange={(e) => touched(setAuditType)(e.target.value)} error={!!fe.auditType} placeholder="Ex. Site web & réseaux sociaux" disabled={isPending} />
          </Field>

          <Field label="Date de l'audit" htmlFor="a-date" error={fe.auditDate}>
            <Input id="a-date" type="date" value={auditDate} onChange={(e) => touched(setAuditDate)(e.target.value)} disabled={isPending} />
          </Field>

          <Field label="Gravité globale">
            <Select value={severity} onChange={touched(setSeverity)} options={SEVERITY_NONE_OPTIONS} disabled={isPending} ariaLabel="Gravité globale" />
          </Field>
        </div>

        <Field label="Résumé" htmlFor="a-summary" error={fe.summary}>
          <Textarea id="a-summary" value={summary} onChange={(e) => touched(setSummary)(e.target.value)} error={!!fe.summary} placeholder="Synthèse de l'audit : constats majeurs, niveau de maturité, enjeux prioritaires…" disabled={isPending} />
        </Field>

        <Field label="Méthodologie" htmlFor="a-method" error={fe.methodology}>
          <Textarea id="a-method" value={methodology} onChange={(e) => touched(setMethodology)(e.target.value)} error={!!fe.methodology} placeholder="Démarche suivie : outils, critères d'évaluation, périmètre analysé…" disabled={isPending} />
        </Field>

        {/* Nécessité du numérique */}
        <div className="rounded-xl border border-brand-violet/15 bg-brand-violet/[0.04] p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-da text-white">
              <Globe size={15} />
            </span>
            <h3 className="font-display text-sm font-bold text-navy">Nécessité du numérique à notre ère</h3>
          </div>
          <p className="mb-3 text-xs text-text-secondary">
            Ce paragraphe d'introduction apparaîtra en tête du rapport d'audit remis au prospect.
            Personnalisez-le si nécessaire pour l'adapter au contexte de l'organisation.
          </p>
          <Field label="" htmlFor="a-digital" error={fe.digitalImportanceStatement}>
            <Textarea id="a-digital" value={digitalStatement} onChange={(e) => touched(setDigitalStatement)(e.target.value)} error={!!fe.digitalImportanceStatement} disabled={isPending} className="min-h-32" />
          </Field>
        </div>

        <Field label="Notes internes" htmlFor="a-notes" hint="Visibles uniquement par l'équipe — jamais transmises au prospect." error={fe.internalNotes}>
          <Textarea id="a-notes" value={internalNotes} onChange={(e) => touched(setInternalNotes)(e.target.value)} error={!!fe.internalNotes} placeholder="Contexte, points de vigilance, éléments à confirmer…" disabled={isPending} />
        </Field>

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-navy/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            {saved && !isPending && (<><CheckCircle2 size={16} /> Modifications enregistrées</>)}
          </span>
          <Button type="submit" variant="primary" loading={isPending} disabled={isPending || !title.trim()}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ═════════════════════════════════ ONGLET CONSTATS ═════════════════════════ */

function FindingBlock({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 shrink-0 text-text-muted">{icon}</span>
      <div className="min-w-0">
        <span className="font-semibold text-navy">{label} : </span>
        <span className="break-words text-text-secondary">{children}</span>
      </div>
    </div>
  );
}

function FindingsTab({ audit, editable }: { audit: AuditDetail; editable: boolean }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AuditFindingItem | null>(null);
  const [isBusy, startBusy] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const findings = React.useMemo(
    () => [...audit.findings].sort((a, b) => a.priorityOrder - b.priorityOrder),
    [audit.findings],
  );

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(f: AuditFindingItem) { setEditing(f); setModalOpen(true); }

  function handleDelete(f: AuditFindingItem) {
    if (!window.confirm(`Supprimer le constat « ${f.title} » ?`)) return;
    setError(null);
    startBusy(async () => {
      const res = await deleteFinding({ id: f.id, auditId: audit.id });
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= findings.length) return;
    const ids = findings.map((f) => f.id);
    const tmp = ids[index];
    ids[index] = ids[target];
    ids[target] = tmp;
    setError(null);
    startBusy(async () => {
      const res = await reorderFindings({ auditId: audit.id, orderedIds: ids });
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {findings.length} constat{findings.length > 1 ? "s" : ""}
          {editable ? " — classés par ordre de priorité." : "."}
        </p>
        {editable && (
          <Button type="button" variant="primary" size="sm" onClick={openAdd}>
            <Plus size={16} /> Ajouter un constat
          </Button>
        )}
      </div>

      <FormError message={error} />

      {findings.length === 0 ? (
        <div className={error ? "mt-4" : undefined}>
          <EmptyState
            icon={<ListChecks size={22} />}
            title="Aucun constat"
            description={editable ? "Documentez les problèmes observés, leur gravité et vos recommandations." : "Cet audit ne contient aucun constat."}
          >
            {editable && (
              <Button type="button" variant="primary" size="sm" onClick={openAdd}>
                <Plus size={16} /> Ajouter un constat
              </Button>
            )}
          </EmptyState>
        </div>
      ) : (
        <StaggerGroup className={cn("space-y-4", error && "mt-4")}>
          {findings.map((f, i) => (
            <StaggerItem key={f.id}>
              <Card interactive={false} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-navy/[0.06] text-xs font-bold text-text-secondary">
                        {i + 1}
                      </span>
                      <p className="min-w-0 break-words font-display font-bold text-navy">{f.title}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusPill label={AUDIT_CATEGORY_LABEL[f.category]} tone="slate" dot={false} />
                      <StatusPill label={AUDIT_SEVERITY_LABEL[f.severity]} tone={AUDIT_SEVERITY_TONE[f.severity]} />
                      {!f.isPublic && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.06] px-2.5 py-1 text-xs font-semibold text-text-secondary">
                          <EyeOff size={12} /> Privé
                        </span>
                      )}
                    </div>
                  </div>

                  {editable && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={isBusy || i === 0}
                        aria-label="Monter le constat"
                        className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-brand-blue-royal disabled:opacity-30"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={isBusy || i === findings.length - 1}
                        aria-label="Descendre le constat"
                        className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-brand-blue-royal disabled:opacity-30"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(f)}
                        aria-label="Modifier le constat"
                        className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-brand-blue-royal"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(f)}
                        disabled={isBusy}
                        aria-label="Supprimer le constat"
                        className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {f.description && (
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">
                    {f.description}
                  </p>
                )}

                {(f.businessImpact || f.userImpact || f.securityImpact) && (
                  <div className="mt-3 space-y-1.5 border-t border-navy/[0.06] pt-3">
                    {f.businessImpact && <FindingBlock icon={<Building2 size={14} />} label="Impact business">{f.businessImpact}</FindingBlock>}
                    {f.userImpact && <FindingBlock icon={<User size={14} />} label="Impact utilisateur">{f.userImpact}</FindingBlock>}
                    {f.securityImpact && <FindingBlock icon={<AlertTriangle size={14} />} label="Impact sécurité">{f.securityImpact}</FindingBlock>}
                  </div>
                )}

                {(f.evidenceText || f.evidenceUrl || f.affectedPageUrl) && (
                  <div className="mt-3 space-y-1.5 border-t border-navy/[0.06] pt-3">
                    {f.evidenceText && <FindingBlock icon={<Info size={14} />} label="Preuve">{f.evidenceText}</FindingBlock>}
                    {f.evidenceUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink size={14} className="shrink-0 text-text-muted" />
                        <a href={safeHref(f.evidenceUrl)} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all font-medium text-brand-blue-royal hover:text-brand-violet">
                          Preuve en ligne
                        </a>
                      </div>
                    )}
                    {f.affectedPageUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe size={14} className="shrink-0 text-text-muted" />
                        <a href={safeHref(f.affectedPageUrl)} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all font-medium text-brand-blue-royal hover:text-brand-violet">
                          {f.affectedPageUrl}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {f.recommendation && (
                  <div className="mt-3 rounded-xl border border-success/20 bg-success/5 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-success">
                      <CheckCircle2 size={13} /> Recommandation
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-navy">{f.recommendation}</p>
                  </div>
                )}
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier le constat" : "Nouveau constat"}
        size="lg"
      >
        {modalOpen && (
          <FindingForm
            key={editing?.id ?? "new"}
            auditId={audit.id}
            finding={editing}
            onDone={() => setModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

function FindingForm({
  auditId, finding, onDone,
}: {
  auditId: string;
  finding: AuditFindingItem | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string>>({});

  const [title, setTitle] = React.useState(finding?.title ?? "");
  const [category, setCategory] = React.useState<AuditCategory>(finding?.category ?? AUDIT_CATEGORY_VALUES[0]);
  const [severity, setSeverity] = React.useState<AuditSeverity>(finding?.severity ?? "MODERATE");
  const [description, setDescription] = React.useState(finding?.description ?? "");
  const [businessImpact, setBusinessImpact] = React.useState(finding?.businessImpact ?? "");
  const [userImpact, setUserImpact] = React.useState(finding?.userImpact ?? "");
  const [securityImpact, setSecurityImpact] = React.useState(finding?.securityImpact ?? "");
  const [evidenceText, setEvidenceText] = React.useState(finding?.evidenceText ?? "");
  const [evidenceUrl, setEvidenceUrl] = React.useState(finding?.evidenceUrl ?? "");
  const [affectedPageUrl, setAffectedPageUrl] = React.useState(finding?.affectedPageUrl ?? "");
  const [recommendation, setRecommendation] = React.useState(finding?.recommendation ?? "");
  const [isPublic, setIsPublic] = React.useState(finding?.isPublic ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending || !title.trim()) return;
    setError(null);
    setFe({});

    const payload = {
      auditId,
      title: title.trim(),
      category,
      severity,
      description: description.trim() || undefined,
      businessImpact: businessImpact.trim() || undefined,
      userImpact: userImpact.trim() || undefined,
      securityImpact: securityImpact.trim() || undefined,
      evidenceText: evidenceText.trim() || undefined,
      evidenceUrl: evidenceUrl.trim() || undefined,
      affectedPageUrl: affectedPageUrl.trim() || undefined,
      recommendation: recommendation.trim() || undefined,
      isPublic,
    };

    startTransition(async () => {
      const res = finding
        ? await updateFinding({ ...payload, id: finding.id })
        : await addFinding(payload);
      if (!res.ok) {
        setError(res.error);
        if (res.fieldErrors) setFe(res.fieldErrors);
        return;
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError message={error} />

      <Field label="Titre du constat" htmlFor="f-title" required error={fe.title}>
        <Input id="f-title" value={title} onChange={(e) => setTitle(e.target.value)} error={!!fe.title} placeholder="Ex. Site non sécurisé (absence de HTTPS)" disabled={isPending} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Catégorie" error={fe.category}>
          <Select value={category} onChange={(v) => setCategory(v as AuditCategory)} options={CATEGORY_OPTIONS} disabled={isPending} ariaLabel="Catégorie du constat" />
        </Field>
        <Field label="Gravité" error={fe.severity}>
          <Select value={severity} onChange={(v) => setSeverity(v as AuditSeverity)} options={SEVERITY_OPTIONS} disabled={isPending} ariaLabel="Gravité du constat" />
        </Field>
      </div>

      <Field label="Description" htmlFor="f-desc" error={fe.description}>
        <Textarea id="f-desc" value={description} onChange={(e) => setDescription(e.target.value)} error={!!fe.description} placeholder="Décrivez le problème observé…" disabled={isPending} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Impact business" htmlFor="f-business" error={fe.businessImpact}>
          <Input id="f-business" value={businessImpact} onChange={(e) => setBusinessImpact(e.target.value)} error={!!fe.businessImpact} placeholder="Ex. Perte de crédibilité" disabled={isPending} />
        </Field>
        <Field label="Impact utilisateur" htmlFor="f-user" error={fe.userImpact}>
          <Input id="f-user" value={userImpact} onChange={(e) => setUserImpact(e.target.value)} error={!!fe.userImpact} placeholder="Ex. Navigation difficile" disabled={isPending} />
        </Field>
        <Field label="Impact sécurité" htmlFor="f-security" error={fe.securityImpact}>
          <Input id="f-security" value={securityImpact} onChange={(e) => setSecurityImpact(e.target.value)} error={!!fe.securityImpact} placeholder="Ex. Données exposées" disabled={isPending} />
        </Field>
      </div>

      <Field label="Preuve (constat observé)" htmlFor="f-evidence" error={fe.evidenceText}>
        <Textarea id="f-evidence" value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} error={!!fe.evidenceText} placeholder="Élément factuel appuyant le constat (extrait, message d'erreur…)" disabled={isPending} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Lien de preuve" htmlFor="f-evidence-url" error={fe.evidenceUrl}>
          <Input id="f-evidence-url" type="url" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} error={!!fe.evidenceUrl} placeholder="https://…" disabled={isPending} />
        </Field>
        <Field label="Page concernée" htmlFor="f-page-url" error={fe.affectedPageUrl}>
          <Input id="f-page-url" type="url" value={affectedPageUrl} onChange={(e) => setAffectedPageUrl(e.target.value)} error={!!fe.affectedPageUrl} placeholder="https://exemple.ci/contact" disabled={isPending} />
        </Field>
      </div>

      <Field label="Recommandation" htmlFor="f-reco" error={fe.recommendation}>
        <Textarea id="f-reco" value={recommendation} onChange={(e) => setRecommendation(e.target.value)} error={!!fe.recommendation} placeholder="Action corrective proposée par Digital Access…" disabled={isPending} />
      </Field>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-navy/10 px-3.5 py-2.5 text-sm font-medium text-navy transition-colors hover:border-navy/20">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-navy/30"
          style={{ accentColor: "#5b3fa8" }}
          disabled={isPending}
        />
        <span>Inclure ce constat dans le rapport remis au prospect</span>
      </label>

      <div className="flex flex-col-reverse gap-3 border-t border-navy/[0.06] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isPending}>Annuler</Button>
        <Button type="submit" variant="primary" loading={isPending} disabled={isPending || !title.trim()}>
          {finding ? "Enregistrer" : "Ajouter le constat"}
        </Button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════ ONGLET DOCUMENTS ══════════════════════════ */

interface UploadedFile {
  url: string;
  fileName: string;
  mimeType: string | null;
  size: number | null;
}

function DocumentsTab({ audit, canEditDocs }: { audit: AuditDetail; canEditDocs: boolean }) {
  const router = useRouter();
  const canUpload = canEditDocs && audit.status !== "ARCHIVED";

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploaded, setUploaded] = React.useState<UploadedFile | null>(null);

  const [docType, setDocType] = React.useState<string>(DOC_TYPE_VALUES[0]);
  const [visibility, setVisibility] = React.useState<string>("INTERNAL_ONLY");
  const [isSaving, startSave] = React.useTransition();
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [isDeleting, startDelete] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setSaveError(null);
    setUploaded(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch(UPLOAD_URL, { method: "POST", body: fd });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || data.error) {
        setUploadError(data.error || "Échec de l'envoi du fichier.");
        return;
      }
      setUploaded({ url: data.url, fileName: data.fileName, mimeType: data.mimeType ?? null, size: data.size ?? null });
    } catch {
      setUploadError("Échec de l'envoi du fichier. Réessayez.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleAddDocument() {
    if (!uploaded) return;
    setSaveError(null);
    startSave(async () => {
      const res = await addAuditDocument({
        auditId: audit.id,
        url: uploaded.url,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType ?? undefined,
        size: uploaded.size ?? undefined,
        documentType: docType as AuditDocType,
        visibility: visibility as DocVisibility,
      });
      if (!res.ok) { setSaveError(res.error); return; }
      setUploaded(null);
      setDocType(DOC_TYPE_VALUES[0]);
      setVisibility("INTERNAL_ONLY");
      router.refresh();
    });
  }

  function handleDelete(id: string, fileName: string) {
    if (!window.confirm(`Supprimer le document « ${fileName} » ?`)) return;
    setDeletingId(id);
    startDelete(async () => {
      const res = await deleteAuditDocument({ id, auditId: audit.id });
      setDeletingId(null);
      if (!res.ok) { window.alert(res.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Zone d'upload */}
      {canUpload && (
        <Card interactive={false} className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-da text-white">
              <UploadCloud size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-navy">Ajouter un document</h2>
              <p className="text-xs text-text-secondary">PDF, Word, images — 15 Mo maximum.</p>
            </div>
          </div>

          {!uploaded ? (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (!uploading) void handleFile(e.dataTransfer.files?.[0]);
                }}
                disabled={uploading}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors disabled:cursor-not-allowed",
                  dragOver ? "border-brand-blue-vif bg-brand-blue-vif/5" : "border-navy/15 hover:border-brand-blue-vif/50 hover:bg-navy/[0.02]",
                )}
              >
                {uploading ? (
                  <>
                    <Spinner className="h-6 w-6 text-brand-blue-royal" />
                    <span className="text-sm font-medium text-text-secondary">Envoi en cours…</span>
                  </>
                ) : (
                  <>
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
                      <UploadCloud size={20} />
                    </span>
                    <span className="text-sm font-semibold text-navy">Glissez un fichier ici ou cliquez pour parcourir</span>
                    <span className="text-xs text-text-muted">PDF, DOCX, DOC, PNG, JPG, WEBP</span>
                  </>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept={UPLOAD_ACCEPT}
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
              <FormError message={uploadError} />
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-success/25 bg-success/5 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0 text-success" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{uploaded.fileName}</p>
                    <p className="text-xs text-text-muted">{formatBytes(uploaded.size)} — fichier envoyé</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploaded(null)}
                  disabled={isSaving}
                  aria-label="Retirer le fichier"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Type de document">
                  <Select value={docType} onChange={setDocType} options={DOC_TYPE_OPTIONS} disabled={isSaving} ariaLabel="Type de document" />
                </Field>
                <Field label="Visibilité" hint="« Interne uniquement » n'est jamais partagé au client.">
                  <Select value={visibility} onChange={setVisibility} options={DOC_VISIBILITY_OPTIONS} disabled={isSaving} ariaLabel="Visibilité du document" />
                </Field>
              </div>

              <FormError message={saveError} />

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setUploaded(null)} disabled={isSaving}>Annuler</Button>
                <Button type="button" variant="primary" onClick={handleAddDocument} loading={isSaving} disabled={isSaving}>
                  Ajouter le document
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Liste des documents */}
      {audit.documents.length === 0 ? (
        <EmptyState
          icon={<Paperclip size={22} />}
          title="Aucun document"
          description={canUpload ? "Joignez le rapport d'audit, des captures ou toute preuve utile." : "Aucun document n'a encore été joint à cet audit."}
        />
      ) : (
        <StaggerGroup className="space-y-3">
          {audit.documents.map((d) => (
            <StaggerItem key={d.id}>
              <Card interactive={false} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words font-display font-semibold text-navy">{d.fileName}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusPill label={DOC_TYPE_LABEL[d.documentType]} tone="slate" dot={false} />
                        <StatusPill label={DOC_VISIBILITY_LABEL[d.visibility]} tone={visibilityTone(d.visibility)} />
                      </div>
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                        <span className="font-medium text-text-secondary">v{d.version}</span>
                        <span>•</span>
                        <span>{formatBytes(d.size)}</span>
                        {d.uploadedByName && (<><span>•</span><span>{d.uploadedByName}</span></>)}
                        <span>•</span>
                        <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> {formatDate(d.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-navy/15 bg-surface-primary/40 px-3.5 text-sm font-medium text-navy transition-colors hover:border-brand-blue-vif/60 hover:text-brand-blue-royal"
                    >
                      <Download size={15} /> Télécharger
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id, d.fileName)}
                      disabled={isDeleting && deletingId === d.id}
                      aria-label="Supprimer le document"
                      className="grid h-9 w-9 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                    >
                      {isDeleting && deletingId === d.id ? <Spinner /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
