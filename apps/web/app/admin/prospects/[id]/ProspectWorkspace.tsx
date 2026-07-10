"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft, Archive, AlertTriangle, MapPin, Building2, Globe, Mail, Phone,
  MessageCircle, Pencil, Plus, Trash2, Star,
  ShieldCheck, Target, Send, LayoutGrid, Users, History, FileSearch, ListChecks,
  Handshake, StickyNote, FileText, ClipboardCheck, Reply, RefreshCw, Activity,
  ReceiptText, Wallet, CircleDot, TrendingUp, Calendar, CheckCircle2,
} from "lucide-react";
import {
  Button, Card, Field, Input, Textarea, cn, formatFCFA, formatDate,
  GradientText, StaggerGroup, StaggerItem,
} from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { StatusPill, EmptyState } from "@/components/admin/ui";
import { TabBar, type TabDef } from "@/components/admin/Tabs";
import { Modal } from "@/components/admin/Modal";
import type {
  ProspectDetail, AssignableUser, OrganizationSummary, ContactRow,
  Tone, OrganizationType, Priority, ProspectStatus, ActivityType,
} from "@/lib/crm-types";
import {
  PROSPECT_STATUS_VALUES, PROSPECT_STATUS_LABEL, PROSPECT_STATUS_TONE,
  PRIORITY_VALUES, PRIORITY_LABEL, PRIORITY_TONE,
  ORG_TYPE_VALUES, ORG_TYPE_LABEL,
  ACTIVITY_TYPE_VALUES, ACTIVITY_TYPE_LABEL,
  AUDIT_STATUS_LABEL, AUDIT_STATUS_TONE, AUDIT_SEVERITY_LABEL, AUDIT_SEVERITY_TONE,
  TASK_STATUS_LABEL, TASK_STATUS_TONE, DEAL_STAGE_LABEL, DEAL_STAGE_TONE,
} from "@/lib/crm-types";
import {
  updateProspectStatus, assignProspect, archiveProspect, updateProspect,
  updateOrganization, createContact, updateContact, deleteContact, logProspectActivity,
} from "@/lib/crm-actions";
import { createAudit } from "@/lib/crm-audit-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Fiche prospect à onglets — CRM commercial. En-tête (statut/attribution/
   archivage), puis onglets Vue d'ensemble / Contacts / Activités / Audits /
   Tâches / Opportunités. Chaque mutation : useTransition, désactivation pendant
   pending, affichage des erreurs, router.refresh() au succès.
   ══════════════════════════════════════════════════════════════════════════ */

const TONE_HEX: Record<Tone, string> = {
  violet: "#5b3fa8", blue: "#2b5cc6", cyan: "#00bcd4", green: "#059669",
  amber: "#f59e0b", red: "#dc2626", slate: "#9ca3af",
};

const STATUS_OPTIONS: SelectOption[] = PROSPECT_STATUS_VALUES.map((v) => ({
  value: v, label: PROSPECT_STATUS_LABEL[v], dotColor: TONE_HEX[PROSPECT_STATUS_TONE[v]],
}));

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: "", label: "Non définie" },
  ...PRIORITY_VALUES.map((v) => ({ value: v, label: PRIORITY_LABEL[v], dotColor: TONE_HEX[PRIORITY_TONE[v]] })),
];

const ORG_TYPE_OPTIONS: SelectOption[] = ORG_TYPE_VALUES.map((v) => ({ value: v, label: ORG_TYPE_LABEL[v] }));

const ACTIVITY_TYPE_OPTIONS: SelectOption[] = ACTIVITY_TYPE_VALUES.map((v) => ({ value: v, label: ACTIVITY_TYPE_LABEL[v] }));

const MATURITY_OPTIONS: SelectOption[] = [
  { value: "", label: "Non évaluée" },
  { value: "faible", label: "Faible" },
  { value: "moyenne", label: "Moyenne" },
  { value: "bonne", label: "Bonne" },
  { value: "avancée", label: "Avancée" },
];

const INFLUENCE_OPTIONS: SelectOption[] = [
  { value: "", label: "Non définie" },
  { value: "faible", label: "Faible" },
  { value: "moyenne", label: "Moyenne" },
  { value: "forte", label: "Forte" },
];

const CHANNEL_OPTIONS: SelectOption[] = [
  { value: "", label: "Non défini" },
  { value: "Email", label: "Email" },
  { value: "Téléphone", label: "Téléphone" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "LinkedIn", label: "LinkedIn" },
];

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  NOTE: StickyNote, CALL: Phone, EMAIL: Mail, WHATSAPP: MessageCircle, MEETING: Users,
  DOCUMENT_SENT: FileText, AUDIT_SENT: ClipboardCheck, RESPONSE_RECEIVED: Reply,
  FOLLOW_UP: RefreshCw, STATUS_CHANGE: Activity, QUOTE_SENT: ReceiptText,
  PAYMENT_RECEIVED: Wallet, OTHER: CircleDot,
};

/* Icônes de marque (absentes de cette version de lucide) — SVG inline. */
function Linkedin({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}
function Facebook({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
function Instagram({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

type TabId = "overview" | "contacts" | "activities" | "audits" | "tasks" | "deals";

/* ─── Bloc d'erreur inline réutilisable ─────────────────────────────────────── */
function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error">
      {message}
    </div>
  );
}

/* ══════════════════════════ COMPOSANT PRINCIPAL ════════════════════════════ */

export function ProspectWorkspace({
  prospect, assignable, canAssign, canArchive,
}: {
  prospect: ProspectDetail;
  assignable: AssignableUser[];
  canAssign: boolean;
  canArchive: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabId>("overview");
  const [isPending, startTransition] = React.useTransition();
  const [headerError, setHeaderError] = React.useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const org = prospect.organization;

  const assigneeOptions: SelectOption[] = [
    { value: "", label: "Non attribué" },
    ...assignable.map((u) => ({ value: u.id, label: u.name })),
  ];

  function handleStatus(next: string) {
    if (next === prospect.status) return;
    setHeaderError(null);
    startTransition(async () => {
      const res = await updateProspectStatus({ id: prospect.id, status: next as ProspectStatus });
      if (!res.ok) { setHeaderError(res.error); return; }
      router.refresh();
    });
  }

  function handleAssign(v: string) {
    setHeaderError(null);
    startTransition(async () => {
      const res = await assignProspect({ id: prospect.id, assigneeId: v === "" ? null : v });
      if (!res.ok) { setHeaderError(res.error); return; }
      router.refresh();
    });
  }

  function handleArchive() {
    setHeaderError(null);
    startTransition(async () => {
      const res = await archiveProspect({ id: prospect.id });
      if (!res.ok) { setHeaderError(res.error); setArchiveOpen(false); return; }
      router.push("/admin/prospects");
    });
  }

  const tabs: TabDef[] = [
    { id: "overview", label: "Vue d'ensemble", icon: LayoutGrid },
    { id: "contacts", label: "Contacts", icon: Users, badge: prospect.contacts.length },
    { id: "activities", label: "Activités", icon: History, badge: prospect.activities.length },
    { id: "audits", label: "Audits", icon: FileSearch, badge: prospect.audits.length },
    { id: "tasks", label: "Tâches", icon: ListChecks, badge: prospect.tasks.length },
    { id: "deals", label: "Opportunités", icon: Handshake, badge: prospect.deals.length },
  ];

  return (
    <div>
      {/* Retour */}
      <Link
        href="/admin/prospects"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
      >
        <ArrowLeft size={16} /> Prospects
      </Link>

      {/* En-tête */}
      <div className="mt-4 flex flex-col gap-5 border-b border-navy/[0.08] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <GradientText className="text-xs font-bold uppercase tracking-wider">
            Fiche prospect
          </GradientText>
          <h1 className="mt-1 break-words font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            {org.name}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
            <span>{ORG_TYPE_LABEL[org.organizationType]}</span>
            {org.city && (
              <>
                <span className="text-text-muted">•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {org.city}
                  {org.country ? `, ${org.country}` : ""}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 lg:w-auto lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={PROSPECT_STATUS_LABEL[prospect.status]} tone={PROSPECT_STATUS_TONE[prospect.status]} />
            {prospect.priority && (
              <StatusPill label={PRIORITY_LABEL[prospect.priority]} tone={PRIORITY_TONE[prospect.priority]} />
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
            <div className="w-full sm:w-52">
              <span className="mb-1 block text-xs font-medium text-text-muted">Statut</span>
              <Select
                value={prospect.status}
                onChange={handleStatus}
                options={STATUS_OPTIONS}
                disabled={isPending}
                ariaLabel="Statut du prospect"
              />
            </div>

            {canAssign && (
              <div className="w-full sm:w-52">
                <span className="mb-1 block text-xs font-medium text-text-muted">Responsable</span>
                <Select
                  value={prospect.assignedTo?.id ?? ""}
                  onChange={handleAssign}
                  options={assigneeOptions}
                  disabled={isPending}
                  ariaLabel="Responsable du prospect"
                />
              </div>
            )}

            {canArchive && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setArchiveOpen(true)}
                disabled={isPending}
                className="border-error/30 text-error hover:border-error/60 hover:text-error"
              >
                <Archive size={16} /> Archiver
              </Button>
            )}
          </div>

          <FormError message={headerError} />
        </div>
      </div>

      {/* Onglets */}
      <div className="mt-6">
        <TabBar tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} layoutGroupId="prospect-tab" />
      </div>

      <div className="mt-6">
        {tab === "overview" && <OverviewTab prospect={prospect} />}
        {tab === "contacts" && <ContactsTab prospect={prospect} />}
        {tab === "activities" && <ActivitiesTab prospect={prospect} />}
        {tab === "audits" && <AuditsTab prospect={prospect} />}
        {tab === "tasks" && <TasksTab prospect={prospect} />}
        {tab === "deals" && <DealsTab prospect={prospect} />}
      </div>

      {/* Confirmation d'archivage */}
      <Modal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archiver ce prospect ?"
        description="Il quittera le pipeline actif. Vous pourrez le retrouver dans les archives."
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
              {isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Archiver le prospect
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-[#B45309]">
            <AlertTriangle size={18} />
          </span>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-navy">{org.name}</span> sera marqué comme archivé et
            retiré du suivi commercial courant.
          </p>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════ ONGLET VUE D'ENSEMBLE ═════════════════════════ */

function InfoLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 shrink-0 text-text-muted">{icon}</span>
      <span className="min-w-0 break-words text-navy">{children}</span>
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  const safe = /^https?:\/\//i.test(href) ? href : `https://${href}`;
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className="min-w-0 break-all font-medium text-brand-blue-royal transition-colors hover:text-brand-violet"
    >
      {label}
    </a>
  );
}

function OverviewTab({ prospect }: { prospect: ProspectDetail }) {
  const [orgOpen, setOrgOpen] = React.useState(false);
  const org = prospect.organization;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Colonne gauche — Organisation */}
      <Card interactive={false} className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
              <Building2 size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-navy">Organisation</h2>
              <p className="text-xs text-text-secondary">{ORG_TYPE_LABEL[org.organizationType]}</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setOrgOpen(true)}>
            <Pencil size={14} /> Modifier
          </Button>
        </div>

        <div className="space-y-2.5">
          {org.sector && <InfoLine icon={<Target size={15} />}>{org.sector}</InfoLine>}
          {(org.city || org.country) && (
            <InfoLine icon={<MapPin size={15} />}>
              {[org.city, org.country].filter(Boolean).join(", ")}
            </InfoLine>
          )}
          {org.website && (
            <InfoLine icon={<Globe size={15} />}>
              <ExternalLink href={org.website} label={org.website} />
            </InfoLine>
          )}
          {org.email && (
            <InfoLine icon={<Mail size={15} />}>
              <a href={`mailto:${org.email}`} className="break-all font-medium text-brand-blue-royal hover:text-brand-violet">
                {org.email}
              </a>
            </InfoLine>
          )}
          {org.phone && (
            <InfoLine icon={<Phone size={15} />}>
              <a href={`tel:${org.phone}`} className="font-medium text-brand-blue-royal hover:text-brand-violet">
                {org.phone}
              </a>
            </InfoLine>
          )}
          {org.whatsapp && <InfoLine icon={<MessageCircle size={15} />}>{org.whatsapp}</InfoLine>}
          {org.linkedinUrl && (
            <InfoLine icon={<Linkedin size={15} />}><ExternalLink href={org.linkedinUrl} label="LinkedIn" /></InfoLine>
          )}
          {org.facebookUrl && (
            <InfoLine icon={<Facebook size={15} />}><ExternalLink href={org.facebookUrl} label="Facebook" /></InfoLine>
          )}
          {org.instagramUrl && (
            <InfoLine icon={<Instagram size={15} />}><ExternalLink href={org.instagramUrl} label="Instagram" /></InfoLine>
          )}
          {org.googleBusinessUrl && (
            <InfoLine icon={<MapPin size={15} />}><ExternalLink href={org.googleBusinessUrl} label="Fiche Google" /></InfoLine>
          )}

          {org.description && (
            <p className="mt-3 border-t border-navy/[0.06] pt-3 text-sm leading-relaxed text-text-secondary">
              {org.description}
            </p>
          )}

          {!org.sector && !org.website && !org.email && !org.phone && !org.description && (
            <p className="text-sm text-text-muted">Aucune information complémentaire renseignée.</p>
          )}
        </div>
      </Card>

      {/* Colonne droite — Qualification */}
      <QualificationForm prospect={prospect} />

      {/* Modale édition organisation */}
      <Modal open={orgOpen} onClose={() => setOrgOpen(false)} title="Modifier l'organisation" size="lg">
        {orgOpen && <OrgEditForm org={org} onDone={() => setOrgOpen(false)} />}
      </Modal>
    </div>
  );
}

/* ─── Formulaire de qualification (édition en place) ─────────────────────────── */

function QualificationForm({ prospect }: { prospect: ProspectDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [saved, setSaved] = React.useState(false);

  const [priority, setPriority] = React.useState<string>(prospect.priority ?? "");
  const [source, setSource] = React.useState(prospect.source ?? "");
  const [maturity, setMaturity] = React.useState<string>(prospect.digitalMaturity ?? "");
  const [potential, setPotential] = React.useState(
    prospect.estimatedPotential != null ? String(prospect.estimatedPotential) : "",
  );
  const [offer, setOffer] = React.useState(prospect.recommendedOffer ?? "");
  const [need, setNeed] = React.useState(prospect.mainObservedNeed ?? "");
  const [contactStatus, setContactStatus] = React.useState(prospect.contactStatus ?? "");
  const [nextAction, setNextAction] = React.useState(prospect.nextAction ?? "");
  const [nextActionDate, setNextActionDate] = React.useState(prospect.nextActionDate?.slice(0, 10) ?? "");

  function touched<T>(setter: (v: T) => void) {
    return (v: T) => { setSaved(false); setter(v); };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    setFieldErrors({});

    const t = potential.trim();
    let estimatedPotential: number | null | undefined;
    if (t === "") estimatedPotential = null;
    else {
      const n = Number(t);
      estimatedPotential = Number.isFinite(n) ? n : undefined;
    }

    startTransition(async () => {
      const res = await updateProspect({
        id: prospect.id,
        priority: priority === "" ? null : (priority as Priority),
        source: source.trim(),
        digitalMaturity: maturity,
        estimatedPotential,
        recommendedOffer: offer.trim(),
        mainObservedNeed: need.trim(),
        contactStatus: contactStatus.trim(),
        nextAction: nextAction.trim(),
        nextActionDate,
      });
      if (!res.ok) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card interactive={false} className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-cyan/15 text-[#0891a6]">
          <Target size={18} />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Qualification</h2>
          <p className="text-xs text-text-secondary">Potentiel, besoin et prochaine action.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormError message={error} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Priorité">
            <Select value={priority || ""} onChange={touched(setPriority)} options={PRIORITY_OPTIONS} ariaLabel="Priorité" />
          </Field>

          <Field label="Maturité numérique">
            <Select value={maturity || ""} onChange={touched(setMaturity)} options={MATURITY_OPTIONS} ariaLabel="Maturité numérique" />
          </Field>

          <Field label="Source" htmlFor="q-source" error={fieldErrors.source}>
            <Input id="q-source" value={source} onChange={(e) => touched(setSource)(e.target.value)} error={!!fieldErrors.source} placeholder="Ex. Prospection terrain" />
          </Field>

          <Field label="Potentiel estimé (FCFA)" htmlFor="q-potential" error={fieldErrors.estimatedPotential}>
            <Input
              id="q-potential"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={potential}
              onChange={(e) => touched(setPotential)(e.target.value)}
              error={!!fieldErrors.estimatedPotential}
              placeholder="Ex. 500000"
            />
          </Field>
        </div>

        <Field label="Offre recommandée" htmlFor="q-offer" error={fieldErrors.recommendedOffer}>
          <Input id="q-offer" value={offer} onChange={(e) => touched(setOffer)(e.target.value)} error={!!fieldErrors.recommendedOffer} placeholder="Ex. Pack Site vitrine + maintenance" />
        </Field>

        <Field label="Besoin principal observé" htmlFor="q-need" error={fieldErrors.mainObservedNeed}>
          <Textarea id="q-need" value={need} onChange={(e) => touched(setNeed)(e.target.value)} error={!!fieldErrors.mainObservedNeed} placeholder="Absence de site, image datée, faible visibilité…" />
        </Field>

        <Field label="Statut de contact" htmlFor="q-contact-status" error={fieldErrors.contactStatus}>
          <Input id="q-contact-status" value={contactStatus} onChange={(e) => touched(setContactStatus)(e.target.value)} error={!!fieldErrors.contactStatus} placeholder="Ex. Décideur identifié, en attente de retour…" />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prochaine action" htmlFor="q-next" error={fieldErrors.nextAction}>
            <Input id="q-next" value={nextAction} onChange={(e) => touched(setNextAction)(e.target.value)} error={!!fieldErrors.nextAction} placeholder="Ex. Rappeler après l'audit" />
          </Field>
          <Field label="Échéance">
            <Input type="date" value={nextActionDate} onChange={(e) => touched(setNextActionDate)(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-navy/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            {saved && !isPending && (<><CheckCircle2 size={16} /> Modifications enregistrées</>)}
          </span>
          <Button type="submit" variant="primary" loading={isPending} disabled={isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ─── Formulaire d'édition d'organisation (modale) ───────────────────────────── */

function OrgEditForm({ org, onDone }: { org: OrganizationSummary; onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string>>({});

  const [name, setName] = React.useState(org.name);
  const [legalName, setLegalName] = React.useState("");
  const [orgType, setOrgType] = React.useState<OrganizationType>(org.organizationType);
  const [sector, setSector] = React.useState(org.sector ?? "");
  const [subSector, setSubSector] = React.useState("");
  const [description, setDescription] = React.useState(org.description ?? "");
  const [website, setWebsite] = React.useState(org.website ?? "");
  const [email, setEmail] = React.useState(org.email ?? "");
  const [phone, setPhone] = React.useState(org.phone ?? "");
  const [whatsapp, setWhatsapp] = React.useState(org.whatsapp ?? "");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState(org.city ?? "");
  const [country, setCountry] = React.useState(org.country ?? "");
  const [linkedinUrl, setLinkedinUrl] = React.useState(org.linkedinUrl ?? "");
  const [facebookUrl, setFacebookUrl] = React.useState(org.facebookUrl ?? "");
  const [instagramUrl, setInstagramUrl] = React.useState(org.instagramUrl ?? "");
  const [googleBusinessUrl, setGoogleBusinessUrl] = React.useState(org.googleBusinessUrl ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending || !name.trim()) return;
    setError(null);
    setFe({});
    startTransition(async () => {
      const res = await updateOrganization({
        id: org.id,
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        organizationType: orgType,
        sector: sector.trim() || undefined,
        subSector: subSector.trim() || undefined,
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        googleBusinessUrl: googleBusinessUrl.trim() || undefined,
      });
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom" htmlFor="o-name" required error={fe.name} className="sm:col-span-2">
          <Input id="o-name" value={name} onChange={(e) => setName(e.target.value)} error={!!fe.name} placeholder="Nom de l'organisation" />
        </Field>

        <Field label="Raison sociale" htmlFor="o-legal" error={fe.legalName}>
          <Input id="o-legal" value={legalName} onChange={(e) => setLegalName(e.target.value)} error={!!fe.legalName} placeholder="Dénomination légale" />
        </Field>

        <Field label="Type d'organisation" error={fe.organizationType}>
          <Select value={orgType} onChange={(v) => setOrgType(v as OrganizationType)} options={ORG_TYPE_OPTIONS} ariaLabel="Type d'organisation" />
        </Field>

        <Field label="Secteur" htmlFor="o-sector" error={fe.sector}>
          <Input id="o-sector" value={sector} onChange={(e) => setSector(e.target.value)} error={!!fe.sector} placeholder="Ex. Mode & textile" />
        </Field>

        <Field label="Sous-secteur" htmlFor="o-subsector" error={fe.subSector}>
          <Input id="o-subsector" value={subSector} onChange={(e) => setSubSector(e.target.value)} error={!!fe.subSector} placeholder="Ex. Prêt-à-porter" />
        </Field>

        <Field label="Description" htmlFor="o-desc" error={fe.description} className="sm:col-span-2">
          <Textarea id="o-desc" value={description} onChange={(e) => setDescription(e.target.value)} error={!!fe.description} placeholder="Présentation de l'organisation…" />
        </Field>

        <Field label="Site web" htmlFor="o-website" error={fe.website}>
          <Input id="o-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} error={!!fe.website} placeholder="https://exemple.ci" />
        </Field>

        <Field label="Email" htmlFor="o-email" error={fe.email}>
          <Input id="o-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!fe.email} placeholder="contact@exemple.ci" />
        </Field>

        <Field label="Téléphone" htmlFor="o-phone" error={fe.phone}>
          <Input id="o-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={!!fe.phone} placeholder="+225 07 00 00 00 00" />
        </Field>

        <Field label="WhatsApp" htmlFor="o-whatsapp" error={fe.whatsapp}>
          <Input id="o-whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} error={!!fe.whatsapp} placeholder="+225 07 00 00 00 00" />
        </Field>

        <Field label="Adresse" htmlFor="o-address" error={fe.address} className="sm:col-span-2">
          <Input id="o-address" value={address} onChange={(e) => setAddress(e.target.value)} error={!!fe.address} placeholder="Rue, quartier…" />
        </Field>

        <Field label="Ville" htmlFor="o-city" error={fe.city}>
          <Input id="o-city" value={city} onChange={(e) => setCity(e.target.value)} error={!!fe.city} placeholder="Ex. Abidjan" />
        </Field>

        <Field label="Pays" htmlFor="o-country" error={fe.country}>
          <Input id="o-country" value={country} onChange={(e) => setCountry(e.target.value)} error={!!fe.country} placeholder="Ex. Côte d'Ivoire" />
        </Field>

        <Field label="LinkedIn" htmlFor="o-linkedin" error={fe.linkedinUrl}>
          <Input id="o-linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} error={!!fe.linkedinUrl} placeholder="https://linkedin.com/company/…" />
        </Field>

        <Field label="Facebook" htmlFor="o-facebook" error={fe.facebookUrl}>
          <Input id="o-facebook" type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} error={!!fe.facebookUrl} placeholder="https://facebook.com/…" />
        </Field>

        <Field label="Instagram" htmlFor="o-instagram" error={fe.instagramUrl}>
          <Input id="o-instagram" type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} error={!!fe.instagramUrl} placeholder="https://instagram.com/…" />
        </Field>

        <Field label="Fiche Google Business" htmlFor="o-google" error={fe.googleBusinessUrl}>
          <Input id="o-google" type="url" value={googleBusinessUrl} onChange={(e) => setGoogleBusinessUrl(e.target.value)} error={!!fe.googleBusinessUrl} placeholder="https://g.page/…" />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-navy/[0.06] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isPending}>Annuler</Button>
        <Button type="submit" variant="primary" loading={isPending} disabled={isPending || !name.trim()}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════ ONGLET CONTACTS ═══════════════════════════ */

function ContactsTab({ prospect }: { prospect: ProspectDetail }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ContactRow | null>(null);
  const [isDeleting, startDelete] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(c: ContactRow) { setEditing(c); setModalOpen(true); }

  function handleDelete(c: ContactRow) {
    if (!window.confirm(`Supprimer le contact « ${c.fullName} » ?`)) return;
    setDeletingId(c.id);
    startDelete(async () => {
      const res = await deleteContact({ id: c.id, organizationId: prospect.organization.id });
      setDeletingId(null);
      if (!res.ok) { window.alert(res.error); return; }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {prospect.contacts.length} contact{prospect.contacts.length > 1 ? "s" : ""}
        </p>
        <Button type="button" variant="primary" size="sm" onClick={openAdd}>
          <Plus size={16} /> Ajouter un contact
        </Button>
      </div>

      {prospect.contacts.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="Aucun contact"
          description="Ajoutez les interlocuteurs clés de cette organisation (décideurs, référents…)."
        >
          <Button type="button" variant="primary" size="sm" onClick={openAdd}>
            <Plus size={16} /> Ajouter un contact
          </Button>
        </EmptyState>
      ) : (
        <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {prospect.contacts.map((c) => (
            <StaggerItem key={c.id}>
              <Card interactive={false} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words font-display font-bold text-navy">{c.fullName}</p>
                      {c.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-violet/10 px-2.5 py-1 text-xs font-semibold text-brand-violet">
                          <Star size={12} /> Principal
                        </span>
                      )}
                      {c.isDecisionMaker && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                          <ShieldCheck size={12} /> Décideur
                        </span>
                      )}
                    </div>
                    {(c.jobTitle || c.department) && (
                      <p className="mt-0.5 text-sm text-text-secondary">
                        {[c.jobTitle, c.department].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      aria-label="Modifier le contact"
                      className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-brand-blue-royal"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      disabled={isDeleting && deletingId === c.id}
                      aria-label="Supprimer le contact"
                      className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {c.email && (
                    <InfoLine icon={<Mail size={14} />}>
                      <a href={`mailto:${c.email}`} className="break-all text-brand-blue-royal hover:text-brand-violet">{c.email}</a>
                    </InfoLine>
                  )}
                  {c.phone && (
                    <InfoLine icon={<Phone size={14} />}>
                      <a href={`tel:${c.phone}`} className="text-brand-blue-royal hover:text-brand-violet">{c.phone}</a>
                    </InfoLine>
                  )}
                  {c.whatsapp && <InfoLine icon={<MessageCircle size={14} />}>{c.whatsapp}</InfoLine>}
                  {c.linkedinUrl && (
                    <InfoLine icon={<Linkedin size={14} />}><ExternalLink href={c.linkedinUrl} label="LinkedIn" /></InfoLine>
                  )}
                </div>

                {(c.preferredChannel || c.influenceLevel) && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-navy/[0.06] pt-3">
                    {c.preferredChannel && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2.5 py-1 text-xs font-medium text-text-secondary">
                        Canal : {c.preferredChannel}
                      </span>
                    )}
                    {c.influenceLevel && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2.5 py-1 text-xs font-medium text-text-secondary">
                        Influence : {c.influenceLevel}
                      </span>
                    )}
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
        title={editing ? "Modifier le contact" : "Nouveau contact"}
        size="lg"
      >
        {modalOpen && (
          <ContactForm
            key={editing?.id ?? "new"}
            organizationId={prospect.organization.id}
            contact={editing}
            onDone={() => setModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  const first = parts.shift() ?? "";
  return { first, last: parts.join(" ") };
}

function ContactForm({
  organizationId, contact, onDone,
}: {
  organizationId: string;
  contact: ContactRow | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string>>({});

  const initial = React.useMemo(() => splitName(contact?.fullName ?? ""), [contact]);
  const [firstName, setFirstName] = React.useState(initial.first);
  const [lastName, setLastName] = React.useState(initial.last);
  const [jobTitle, setJobTitle] = React.useState(contact?.jobTitle ?? "");
  const [department, setDepartment] = React.useState(contact?.department ?? "");
  const [email, setEmail] = React.useState(contact?.email ?? "");
  const [phone, setPhone] = React.useState(contact?.phone ?? "");
  const [whatsapp, setWhatsapp] = React.useState(contact?.whatsapp ?? "");
  const [linkedinUrl, setLinkedinUrl] = React.useState(contact?.linkedinUrl ?? "");
  const [isPrimary, setIsPrimary] = React.useState(contact?.isPrimary ?? false);
  const [isDecisionMaker, setIsDecisionMaker] = React.useState(contact?.isDecisionMaker ?? false);
  const [influenceLevel, setInfluenceLevel] = React.useState<string>(contact?.influenceLevel ?? "");
  const [preferredChannel, setPreferredChannel] = React.useState<string>(contact?.preferredChannel ?? "");
  const [notes, setNotes] = React.useState(contact?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending || !firstName.trim()) return;
    setError(null);
    setFe({});

    const payload = {
      organizationId,
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      department: department.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      isPrimary,
      isDecisionMaker,
      influenceLevel: influenceLevel || undefined,
      preferredChannel: preferredChannel || undefined,
      notes: notes.trim() || undefined,
    };

    startTransition(async () => {
      const res = contact
        ? await updateContact({ ...payload, id: contact.id })
        : await createContact(payload);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="c-first" required error={fe.firstName}>
          <Input id="c-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={!!fe.firstName} placeholder="Ex. Aïcha" />
        </Field>
        <Field label="Nom" htmlFor="c-last" error={fe.lastName}>
          <Input id="c-last" value={lastName} onChange={(e) => setLastName(e.target.value)} error={!!fe.lastName} placeholder="Ex. Koné" />
        </Field>

        <Field label="Fonction" htmlFor="c-job" error={fe.jobTitle}>
          <Input id="c-job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} error={!!fe.jobTitle} placeholder="Ex. Directrice générale" />
        </Field>
        <Field label="Département" htmlFor="c-dept" error={fe.department}>
          <Input id="c-dept" value={department} onChange={(e) => setDepartment(e.target.value)} error={!!fe.department} placeholder="Ex. Direction" />
        </Field>

        <Field label="Email" htmlFor="c-email" error={fe.email}>
          <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!fe.email} placeholder="a.kone@exemple.ci" />
        </Field>
        <Field label="Téléphone" htmlFor="c-phone" error={fe.phone}>
          <Input id="c-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={!!fe.phone} placeholder="+225 07 00 00 00 00" />
        </Field>

        <Field label="WhatsApp" htmlFor="c-whatsapp" error={fe.whatsapp}>
          <Input id="c-whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} error={!!fe.whatsapp} placeholder="+225 07 00 00 00 00" />
        </Field>
        <Field label="LinkedIn" htmlFor="c-linkedin" error={fe.linkedinUrl}>
          <Input id="c-linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} error={!!fe.linkedinUrl} placeholder="https://linkedin.com/in/…" />
        </Field>

        <Field label="Niveau d'influence">
          <Select value={influenceLevel || ""} onChange={setInfluenceLevel} options={INFLUENCE_OPTIONS} ariaLabel="Niveau d'influence" />
        </Field>
        <Field label="Canal préféré">
          <Select value={preferredChannel || ""} onChange={setPreferredChannel} options={CHANNEL_OPTIONS} ariaLabel="Canal préféré" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-navy/10 px-3.5 py-2.5 text-sm font-medium text-navy transition-colors hover:border-navy/20">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="h-4 w-4 rounded border-navy/30"
            style={{ accentColor: "#5b3fa8" }}
          />
          <span className="inline-flex items-center gap-1.5"><Star size={14} className="text-brand-violet" /> Contact principal</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-navy/10 px-3.5 py-2.5 text-sm font-medium text-navy transition-colors hover:border-navy/20">
          <input
            type="checkbox"
            checked={isDecisionMaker}
            onChange={(e) => setIsDecisionMaker(e.target.checked)}
            className="h-4 w-4 rounded border-navy/30"
            style={{ accentColor: "#059669" }}
          />
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-success" /> Décideur</span>
        </label>
      </div>

      <Field label="Notes" htmlFor="c-notes" error={fe.notes}>
        <Textarea id="c-notes" value={notes} onChange={(e) => setNotes(e.target.value)} error={!!fe.notes} placeholder="Contexte, préférences, historique…" />
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-navy/[0.06] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isPending}>Annuler</Button>
        <Button type="submit" variant="primary" loading={isPending} disabled={isPending || !firstName.trim()}>
          {contact ? "Enregistrer" : "Ajouter le contact"}
        </Button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════ ONGLET ACTIVITÉS ══════════════════════════ */

function ActivitiesTab({ prospect }: { prospect: ProspectDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [type, setType] = React.useState<string>("NOTE");
  const [subject, setSubject] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    if (!subject.trim() && !notes.trim()) {
      setError("Renseignez au moins un objet ou une note.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await logProspectActivity({
        prospectId: prospect.id,
        type,
        subject: subject.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (!res.ok) { setError(res.error); return; }
      setSubject("");
      setNotes("");
      setType("NOTE");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Composer */}
      <Card interactive={false} className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-da text-white">
            <History size={18} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Journaliser une activité</h2>
            <p className="text-xs text-text-secondary">Gardez une trace des échanges avec ce prospect.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <FormError message={error} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Type">
              <Select value={type} onChange={setType} options={ACTIVITY_TYPE_OPTIONS} ariaLabel="Type d'activité" />
            </Field>
            <Field label="Objet" htmlFor="a-subject" className="sm:col-span-2">
              <Input id="a-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex. Appel de découverte" />
            </Field>
          </div>
          <Field label="Notes" htmlFor="a-notes">
            <Textarea id="a-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails de l'échange…" />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={isPending} disabled={isPending}>
              <Send size={16} /> Ajouter
            </Button>
          </div>
        </form>
      </Card>

      {/* Timeline */}
      {prospect.activities.length === 0 ? (
        <EmptyState
          icon={<History size={22} />}
          title="Aucune activité"
          description="Les échanges journalisés apparaîtront ici, du plus récent au plus ancien."
        />
      ) : (
        <StaggerGroup className="space-y-3">
          {prospect.activities.map((a) => {
            const Icon = ACTIVITY_ICON[a.type] ?? CircleDot;
            return (
              <StaggerItem key={a.id}>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-da text-white">
                      <Icon size={16} />
                    </span>
                    <span className="mt-1 w-px flex-1 bg-navy/10" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-navy/[0.07] bg-surface-primary p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label={ACTIVITY_TYPE_LABEL[a.type]} tone="blue" dot={false} />
                      {a.subject && <span className="min-w-0 break-words font-semibold text-navy">{a.subject}</span>}
                    </div>
                    {a.notes && <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-text-secondary">{a.notes}</p>}
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1"><Calendar size={12} /> {formatDate(a.activityDate)}</span>
                      {a.authorName && (<><span>•</span><span>{a.authorName}</span></>)}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}

/* ════════════════════════════════ ONGLET AUDITS ════════════════════════════ */

function AuditsTab({ prospect }: { prospect: ProspectDetail }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const createNew = () => {
    setError(null);
    start(async () => {
      const res = await createAudit({ prospectId: prospect.id, title: `Audit — ${prospect.organization.name}` });
      if (res.ok) router.push(`/admin/audits/${res.auditId}`);
      else setError(res.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">Diagnostics numériques réalisés pour ce prospect.</p>
        <Button size="sm" onClick={createNew} loading={pending}>
          <Plus size={16} /> Nouvel audit
        </Button>
      </div>
      {error && <p className="text-sm font-medium text-error">{error}</p>}

      {prospect.audits.length === 0 ? (
        <EmptyState
          icon={<FileSearch size={22} />}
          title="Aucun audit"
          description="Créez un audit pour diagnostiquer la présence numérique de ce prospect et préparer votre approche commerciale."
        />
      ) : (
        <StaggerGroup className="space-y-3">
          {prospect.audits.map((a) => (
            <StaggerItem key={a.id}>
              <Link href={`/admin/audits/${a.id}`} className="block">
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-navy/[0.05] px-2 py-0.5 font-mono text-xs font-semibold text-text-secondary">
                          <FileText size={12} /> {a.reference}
                        </span>
                        <span className="text-xs font-medium text-text-muted">v{a.version}</span>
                      </div>
                      <p className="mt-1.5 break-words font-display font-bold text-navy">{a.title}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {a.findingCount} constat{a.findingCount > 1 ? "s" : ""}
                        {a.auditDate ? ` · ${formatDate(a.auditDate)}` : ` · créé le ${formatDate(a.createdAt)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusPill label={AUDIT_STATUS_LABEL[a.status]} tone={AUDIT_STATUS_TONE[a.status]} />
                      {a.overallSeverity && (
                        <StatusPill label={AUDIT_SEVERITY_LABEL[a.overallSeverity]} tone={AUDIT_SEVERITY_TONE[a.overallSeverity]} />
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}

/* ════════════════════════════════ ONGLET TÂCHES ════════════════════════════ */

function TasksTab({ prospect }: { prospect: ProspectDetail }) {
  if (prospect.tasks.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks size={22} />}
        title="Aucune tâche"
        description="La gestion des tâches arrive prochainement."
      />
    );
  }
  return (
    <StaggerGroup className="space-y-3">
      {prospect.tasks.map((t) => (
        <StaggerItem key={t.id}>
          <Card interactive={false} className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-display font-bold text-navy">{t.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                  {t.dueDate && (<span className="inline-flex items-center gap-1"><Calendar size={12} /> Échéance {formatDate(t.dueDate)}</span>)}
                  {t.assignedToName && (<><span>•</span><span>{t.assignedToName}</span></>)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <StatusPill label={TASK_STATUS_LABEL[t.status]} tone={TASK_STATUS_TONE[t.status]} />
                <StatusPill label={PRIORITY_LABEL[t.priority]} tone={PRIORITY_TONE[t.priority]} />
              </div>
            </div>
          </Card>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}

/* ═════════════════════════════ ONGLET OPPORTUNITÉS ═════════════════════════ */

function DealsTab({ prospect }: { prospect: ProspectDetail }) {
  if (prospect.deals.length === 0) {
    return (
      <EmptyState
        icon={<Handshake size={22} />}
        title="Aucune opportunité"
        description="Convertissez ce prospect en opportunité depuis le module Opportunités."
      />
    );
  }
  return (
    <StaggerGroup className="space-y-3">
      {prospect.deals.map((d) => (
        <StaggerItem key={d.id}>
          <Card interactive={false} className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-display font-bold text-navy">{d.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp size={12} /> {d.estimatedAmount != null ? formatFCFA(d.estimatedAmount) : "Montant à définir"}
                  </span>
                  {d.probability != null && <span>{d.probability}% de probabilité</span>}
                  {d.expectedCloseDate && (
                    <span className="inline-flex items-center gap-1"><Calendar size={12} /> {formatDate(d.expectedCloseDate)}</span>
                  )}
                </p>
              </div>
              <div className="shrink-0">
                <StatusPill label={DEAL_STAGE_LABEL[d.stage]} tone={DEAL_STAGE_TONE[d.stage]} />
              </div>
            </div>
          </Card>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
