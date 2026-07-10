"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft, Archive, AlertTriangle, Building2, FolderKanban, TrendingUp,
  CalendarDays, UserRound, Target, FileText, Plus, Trash2, Send, CheckCircle2,
  XCircle, ExternalLink, LayoutGrid, ReceiptText, History, Handshake,
  StickyNote, Phone, Mail, MessageCircle, Users, ClipboardCheck, Reply,
  RefreshCw, Activity, Wallet, CircleDot,
} from "lucide-react";
import {
  Button, Card, Field, Input, Textarea, cn, formatFCFA, formatDate,
  GradientText, StaggerGroup, StaggerItem,
} from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { StatusPill, EmptyState } from "@/components/admin/ui";
import { TabBar, type TabDef } from "@/components/admin/Tabs";
import { Modal } from "@/components/admin/Modal";
import type { DealDetail, AssignableUser, Tone, DealStage, ActivityType } from "@/lib/crm-types";
import {
  DEAL_STAGE_VALUES, DEAL_STAGE_LABEL, DEAL_STAGE_TONE, DEAL_CONVERSION_LABEL,
  QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, ACTIVITY_TYPE_VALUES, ACTIVITY_TYPE_LABEL,
} from "@/lib/crm-types";
import {
  updateDeal, updateDealStage, assignDeal, archiveDeal, logDealActivity,
} from "@/lib/crm-deal-actions";
import { createQuote, sendQuote, setQuoteStatus, deleteQuote } from "@/lib/crm-quote-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Fiche opportunité (Deal) à onglets — CRM commercial. En-tête (étape /
   attribution / archivage + bandeaux de conversion & de perte), puis onglets
   Vue d'ensemble / Devis / Activités. Chaque mutation : useTransition,
   désactivation pendant pending, erreurs inline, router.refresh() au succès.
   Zéro débordement horizontal à 375px.
   ══════════════════════════════════════════════════════════════════════════ */

const TONE_HEX: Record<Tone, string> = {
  violet: "#5b3fa8", blue: "#2b5cc6", cyan: "#00bcd4", green: "#059669",
  amber: "#f59e0b", red: "#dc2626", slate: "#9ca3af",
};

const STAGE_OPTIONS: SelectOption[] = DEAL_STAGE_VALUES.map((v) => ({
  value: v, label: DEAL_STAGE_LABEL[v], dotColor: TONE_HEX[DEAL_STAGE_TONE[v]],
}));

const ACTIVITY_TYPE_OPTIONS: SelectOption[] = ACTIVITY_TYPE_VALUES.map((v) => ({
  value: v, label: ACTIVITY_TYPE_LABEL[v],
}));

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  NOTE: StickyNote, CALL: Phone, EMAIL: Mail, WHATSAPP: MessageCircle, MEETING: Users,
  DOCUMENT_SENT: FileText, AUDIT_SENT: ClipboardCheck, RESPONSE_RECEIVED: Reply,
  FOLLOW_UP: RefreshCw, STATUS_CHANGE: Activity, QUOTE_SENT: ReceiptText,
  PAYMENT_RECEIVED: Wallet, OTHER: CircleDot,
};

type TabId = "overview" | "quotes" | "activities";

/* ─── Utilitaires ───────────────────────────────────────────────────────────── */

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error">
      {message}
    </div>
  );
}

function Banner({
  tone, icon, children,
}: {
  tone: "green" | "amber" | "red";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls =
    tone === "green"
      ? "border-success/30 bg-success/5 text-success"
      : tone === "amber"
        ? "border-warning/40 bg-warning/10 text-[#B45309]"
        : "border-error/30 bg-error/5 text-error";
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium", cls)}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

/** Convertit une saisie numérique en entier ou null (vide → null). */
function toIntOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/* ══════════════════════════ COMPOSANT PRINCIPAL ════════════════════════════ */

export function DealWorkspace({
  deal, assignable, canAssign, canArchive, canQuote,
}: {
  deal: DealDetail;
  assignable: AssignableUser[];
  canAssign: boolean;
  canArchive: boolean;
  canQuote: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabId>("overview");
  const [isPending, startTransition] = React.useTransition();
  const [headerError, setHeaderError] = React.useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const [lossOpen, setLossOpen] = React.useState(false);
  const [lossReason, setLossReason] = React.useState("");
  const [lossError, setLossError] = React.useState<string | null>(null);

  const backHref = deal.prospectId ? `/admin/prospects/${deal.prospectId}` : "/admin/opportunites";

  const assigneeOptions: SelectOption[] = [
    { value: "", label: "Non attribué" },
    ...assignable.map((u) => ({ value: u.id, label: u.name })),
  ];

  function handleStage(next: string) {
    if (next === deal.stage) return;
    setHeaderError(null);
    if (next === "LOST") {
      setLossReason("");
      setLossError(null);
      setLossOpen(true);
      return;
    }
    startTransition(async () => {
      const res = await updateDealStage({ id: deal.id, stage: next as DealStage });
      if (!res.ok) { setHeaderError(res.error); return; }
      router.refresh();
    });
  }

  function submitLoss() {
    if (isPending) return;
    if (!lossReason.trim()) { setLossError("Un motif de perte est requis."); return; }
    setLossError(null);
    startTransition(async () => {
      const res = await updateDealStage({ id: deal.id, stage: "LOST", lossReason: lossReason.trim() });
      if (!res.ok) { setLossError(res.error); return; }
      setLossOpen(false);
      setLossReason("");
      router.refresh();
    });
  }

  function handleAssign(v: string) {
    setHeaderError(null);
    startTransition(async () => {
      const res = await assignDeal({ id: deal.id, assigneeId: v === "" ? null : v });
      if (!res.ok) { setHeaderError(res.error); return; }
      router.refresh();
    });
  }

  function handleArchive() {
    setHeaderError(null);
    startTransition(async () => {
      const res = await archiveDeal({ id: deal.id });
      if (!res.ok) { setHeaderError(res.error); setArchiveOpen(false); return; }
      router.push(backHref);
    });
  }

  const tabs: TabDef[] = [
    { id: "overview", label: "Vue d'ensemble", icon: LayoutGrid },
    { id: "quotes", label: "Devis", icon: ReceiptText, badge: deal.quotes.length },
    { id: "activities", label: "Activités", icon: History, badge: deal.activities.length },
  ];

  return (
    <div>
      {/* Retour */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
      >
        <ArrowLeft size={16} /> {deal.prospectId ? "Fiche prospect" : "Opportunités"}
      </Link>

      {/* En-tête */}
      <div className="mt-4 flex flex-col gap-5 border-b border-navy/[0.08] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <GradientText className="text-xs font-bold uppercase tracking-wider">
            <span className="inline-flex items-center gap-1.5"><Handshake size={13} /> Opportunité</span>
          </GradientText>
          <h1 className="mt-1 break-words font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            {deal.title}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={14} className="text-text-muted" />
              {deal.prospectId ? (
                <Link
                  href={`/admin/prospects/${deal.prospectId}`}
                  className="font-medium text-brand-blue-royal transition-colors hover:text-brand-violet"
                >
                  {deal.organization.name}
                </Link>
              ) : (
                <span className="text-navy">{deal.organization.name}</span>
              )}
            </span>
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 lg:w-auto lg:items-end">
          <StatusPill label={DEAL_STAGE_LABEL[deal.stage]} tone={DEAL_STAGE_TONE[deal.stage]} />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
            <div className="w-full sm:w-56">
              <span className="mb-1 block text-xs font-medium text-text-muted">Étape</span>
              <Select
                value={deal.stage}
                onChange={handleStage}
                options={STAGE_OPTIONS}
                disabled={isPending}
                ariaLabel="Étape de l'opportunité"
              />
            </div>

            {canAssign && (
              <div className="w-full sm:w-52">
                <span className="mb-1 block text-xs font-medium text-text-muted">Responsable</span>
                <Select
                  value={deal.assignedTo?.id ?? ""}
                  onChange={handleAssign}
                  options={assigneeOptions}
                  disabled={isPending}
                  ariaLabel="Responsable de l'opportunité"
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

      {/* Bandeaux de statut */}
      <div className="mt-4 space-y-3">
        {deal.projectId && (
          <Banner tone="green" icon={<FolderKanban size={16} />}>
            Opportunité convertie en projet.{" "}
            <Link
              href={`/admin/projets/${deal.projectId}`}
              className="font-semibold underline decoration-success/40 underline-offset-2 hover:decoration-success"
            >
              Ouvrir le projet
            </Link>
          </Banner>
        )}
        {!deal.projectId && deal.conversionStatus === "PENDING" && (
          <Banner tone="amber" icon={<RefreshCw size={16} />}>
            {DEAL_CONVERSION_LABEL.PENDING} — en attente de validation par l'administration.
          </Banner>
        )}
        {!deal.projectId && deal.conversionStatus === "REJECTED" && (
          <Banner tone="red" icon={<XCircle size={16} />}>
            {DEAL_CONVERSION_LABEL.REJECTED} par l'administration.
          </Banner>
        )}
        {deal.stage === "LOST" && deal.lossReason && (
          <Banner tone="red" icon={<AlertTriangle size={16} />}>
            <span className="font-semibold">Perdu :</span> {deal.lossReason}
          </Banner>
        )}
      </div>

      {/* Onglets */}
      <div className="mt-6">
        <TabBar tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} layoutGroupId="deal-tab" />
      </div>

      <div className="mt-6">
        {tab === "overview" && <OverviewTab deal={deal} />}
        {tab === "quotes" && <QuotesTab deal={deal} canQuote={canQuote} />}
        {tab === "activities" && <ActivitiesTab deal={deal} />}
      </div>

      {/* Confirmation d'archivage */}
      <Modal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archiver cette opportunité ?"
        description="Elle quittera le pipeline actif. Vous pourrez la retrouver dans les archives."
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
              Archiver l'opportunité
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-[#B45309]">
            <AlertTriangle size={18} />
          </span>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-navy">{deal.title}</span> sera marquée comme archivée et
            retirée du suivi commercial courant.
          </p>
        </div>
      </Modal>

      {/* Motif de perte */}
      <Modal
        open={lossOpen}
        onClose={() => { if (!isPending) setLossOpen(false); }}
        title="Marquer l'opportunité comme perdue"
        description="Un motif est requis pour garder une trace exploitable."
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setLossOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <button
              type="button"
              onClick={submitLoss}
              disabled={isPending || !lossReason.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-error px-6 text-[0.95rem] font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-50"
            >
              {isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Confirmer la perte
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <FormError message={lossError} />
          <Field label="Motif de perte" htmlFor="loss-reason" required>
            <Textarea
              id="loss-reason"
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              placeholder="Ex. Budget insuffisant, concurrent retenu, projet reporté sine die…"
              autoFocus
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════ ONGLET VUE D'ENSEMBLE ═════════════════════════ */

function RecapLine({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="break-words text-sm font-medium text-navy">{children}</p>
      </div>
    </div>
  );
}

function OverviewTab({ deal }: { deal: DealDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [fe, setFe] = React.useState<Record<string, string>>({});
  const [saved, setSaved] = React.useState(false);

  const [amount, setAmount] = React.useState(deal.estimatedAmount != null ? String(deal.estimatedAmount) : "");
  const [probability, setProbability] = React.useState(deal.probability != null ? String(deal.probability) : "");
  const [closeDate, setCloseDate] = React.useState(deal.expectedCloseDate?.slice(0, 10) ?? "");
  const [offer, setOffer] = React.useState(deal.recommendedOffer ?? "");
  const [need, setNeed] = React.useState(deal.identifiedNeed ?? "");
  const [competitors, setCompetitors] = React.useState(deal.competitors.join(", "));
  const [description, setDescription] = React.useState(deal.description ?? "");
  const [primaryContactId, setPrimaryContactId] = React.useState(deal.primaryContact?.id ?? "");

  const contactOptions: SelectOption[] = [
    { value: "", label: "Aucun contact principal" },
    ...deal.contacts.map((c) => ({ value: c.id, label: c.fullName })),
  ];

  function touched<T>(setter: (v: T) => void) {
    return (v: T) => { setSaved(false); setter(v); };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    setFe({});
    startTransition(async () => {
      const res = await updateDeal({
        id: deal.id,
        estimatedAmount: toIntOrNull(amount),
        probability: toIntOrNull(probability),
        expectedCloseDate: closeDate,
        recommendedOffer: offer.trim(),
        identifiedNeed: need.trim(),
        competitors: competitors.trim(),
        description: description.trim(),
        primaryContactId,
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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Colonne principale — édition */}
      <Card interactive={false} className="p-5 sm:p-6 lg:col-span-2">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
            <Target size={18} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Détails de l'opportunité</h2>
            <p className="text-xs text-text-secondary">Montant, probabilité, besoin et positionnement.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Montant estimé (FCFA)" htmlFor="d-amount" error={fe.estimatedAmount}>
              <Input
                id="d-amount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={amount}
                onChange={(e) => touched(setAmount)(e.target.value)}
                error={!!fe.estimatedAmount}
                placeholder="Ex. 1500000"
              />
            </Field>

            <Field label="Probabilité (%)" htmlFor="d-proba" error={fe.probability}>
              <Input
                id="d-proba"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={5}
                value={probability}
                onChange={(e) => touched(setProbability)(e.target.value)}
                error={!!fe.probability}
                placeholder="Ex. 60"
              />
            </Field>

            <Field label="Clôture prévue" htmlFor="d-close">
              <Input
                id="d-close"
                type="date"
                value={closeDate}
                onChange={(e) => touched(setCloseDate)(e.target.value)}
              />
            </Field>

            <Field label="Contact principal">
              <Select
                value={primaryContactId || ""}
                onChange={touched(setPrimaryContactId)}
                options={contactOptions}
                ariaLabel="Contact principal"
              />
            </Field>
          </div>

          <Field label="Offre recommandée" htmlFor="d-offer" error={fe.recommendedOffer}>
            <Input
              id="d-offer"
              value={offer}
              onChange={(e) => touched(setOffer)(e.target.value)}
              error={!!fe.recommendedOffer}
              placeholder="Ex. Pack Site institutionnel + maintenance Premium"
            />
          </Field>

          <Field label="Besoin identifié" htmlFor="d-need" error={fe.identifiedNeed}>
            <Textarea
              id="d-need"
              value={need}
              onChange={(e) => touched(setNeed)(e.target.value)}
              error={!!fe.identifiedNeed}
              placeholder="Attentes exprimées, contexte, enjeux prioritaires…"
            />
          </Field>

          <Field
            label="Concurrents"
            htmlFor="d-competitors"
            hint="Séparés par des virgules"
            error={fe.competitors}
          >
            <Input
              id="d-competitors"
              value={competitors}
              onChange={(e) => touched(setCompetitors)(e.target.value)}
              error={!!fe.competitors}
              placeholder="Ex. Agence X, prestataire interne, solution SaaS"
            />
          </Field>

          <Field label="Description / notes" htmlFor="d-desc" error={fe.description}>
            <Textarea
              id="d-desc"
              value={description}
              onChange={(e) => touched(setDescription)(e.target.value)}
              error={!!fe.description}
              placeholder="Historique, points d'attention, prochaines étapes…"
            />
          </Field>

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

      {/* Colonne latérale — récap non éditable */}
      <Card interactive={false} className="h-fit p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-cyan/15 text-[#0891a6]">
            <LayoutGrid size={18} />
          </span>
          <h2 className="font-display text-lg font-bold text-navy">Récapitulatif</h2>
        </div>

        <div className="space-y-4">
          <RecapLine icon={<Building2 size={15} />} label="Organisation">
            {deal.organization.name}
          </RecapLine>
          <RecapLine icon={<UserRound size={15} />} label="Responsable">
            {deal.assignedTo?.name ?? "Non attribué"}
          </RecapLine>
          <RecapLine icon={<TrendingUp size={15} />} label="Montant estimé">
            {deal.estimatedAmount != null ? formatFCFA(deal.estimatedAmount) : "À définir"}
          </RecapLine>
          <RecapLine icon={<CalendarDays size={15} />} label="Créée le">
            {formatDate(deal.createdAt)}
          </RecapLine>
          {deal.conversionStatus !== "NOT_REQUESTED" && (
            <RecapLine icon={<FolderKanban size={15} />} label="Conversion">
              {DEAL_CONVERSION_LABEL[deal.conversionStatus]}
            </RecapLine>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ═════════════════════════════════ ONGLET DEVIS ════════════════════════════ */

function QuotesTab({ deal, canQuote }: { deal: DealDetail; canQuote: boolean }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [isActing, startAction] = React.useTransition();
  const [actingId, setActingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setActingId(id);
    startAction(async () => {
      const res = await fn();
      setActingId(null);
      if (!res.ok) { setError(res.error ?? "Une erreur est survenue."); return; }
      router.refresh();
    });
  }

  function handleDelete(id: string, quoteNumber: string) {
    if (!window.confirm(`Supprimer définitivement le devis ${quoteNumber} ?`)) return;
    run(id, () => deleteQuote({ id }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {deal.quotes.length} devis rattaché{deal.quotes.length > 1 ? "s" : ""} à cette opportunité.
        </p>
        {canQuote && (
          <Button type="button" variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Nouveau devis
          </Button>
        )}
      </div>

      {error && <FormError message={error} />}

      {deal.quotes.length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={22} />}
          title="Aucun devis"
          description="Préparez un devis chiffré pour formaliser votre proposition commerciale."
        >
          {canQuote && (
            <Button type="button" variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Nouveau devis
            </Button>
          )}
        </EmptyState>
      ) : (
        <StaggerGroup className="space-y-3">
          {deal.quotes.map((q) => {
            const busy = isActing && actingId === q.id;
            return (
              <StaggerItem key={q.id}>
                <Card interactive={false} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-navy/[0.05] px-2 py-0.5 font-mono text-xs font-semibold text-text-secondary">
                          <FileText size={12} /> {q.number}
                        </span>
                        <StatusPill label={QUOTE_STATUS_LABEL[q.status]} tone={QUOTE_STATUS_TONE[q.status]} />
                      </div>
                      <p className="mt-1.5 break-words font-display font-bold text-navy">{q.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp size={12} /> {formatFCFA(q.total)}
                        </span>
                        <span>Créé {formatDate(q.createdAt)}</span>
                        {q.sentAt && <span>Envoyé {formatDate(q.sentAt)}</span>}
                        {q.acceptedAt && <span>Accepté {formatDate(q.acceptedAt)}</span>}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <a
                        href={`/admin/devis/${q.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-navy/15 px-3 text-sm font-medium text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal"
                      >
                        <ExternalLink size={14} /> Voir / imprimer
                      </a>

                      {canQuote && q.status === "DRAFT" && (
                        <>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => run(q.id, () => sendQuote({ id: q.id }))}
                            loading={busy}
                            disabled={isActing}
                          >
                            <Send size={14} /> Envoyer
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q.id, q.number)}
                            disabled={isActing}
                            aria-label="Supprimer le devis"
                            className="grid h-9 w-9 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}

                      {canQuote && q.status === "SENT" && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => run(q.id, () => setQuoteStatus({ id: q.id, status: "ACCEPTED" }))}
                            loading={busy}
                            disabled={isActing}
                            className="border-success/40 text-success hover:border-success hover:text-success"
                          >
                            <CheckCircle2 size={14} /> Accepté
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => run(q.id, () => setQuoteStatus({ id: q.id, status: "REJECTED" }))}
                            disabled={isActing}
                            className="border-error/30 text-error hover:border-error/60 hover:text-error"
                          >
                            <XCircle size={14} /> Refusé
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouveau devis"
        description="Chiffrez votre proposition. Les totaux sont calculés automatiquement."
        size="lg"
      >
        {createOpen && (
          <QuoteForm dealId={deal.id} onDone={() => setCreateOpen(false)} />
        )}
      </Modal>
    </div>
  );
}

/* ─── Formulaire de création de devis (éditeur de lignes) ────────────────────── */

interface LineDraft { key: string; label: string; quantity: string; unitPrice: string }

function newLine(): LineDraft {
  return { key: (globalThis.crypto?.randomUUID?.() ?? String(Math.random())), label: "", quantity: "1", unitPrice: "" };
}

function QuoteForm({ dealId, onDone }: { dealId: string; onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [lines, setLines] = React.useState<LineDraft[]>([newLine()]);
  const [taxRate, setTaxRate] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() { setLines((prev) => [...prev, newLine()]); }
  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  const lineAmount = (l: LineDraft) => Math.round((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0));
  const subtotal = lines.reduce((s, l) => s + lineAmount(l), 0);
  const taxPct = Number(taxRate) || 0;
  const tax = Math.round((subtotal * taxPct) / 100);
  const total = subtotal + tax;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    setError(null);

    if (!title.trim()) { setError("Indiquez un titre pour le devis."); return; }
    const items = lines
      .map((l) => ({ label: l.label.trim(), quantity: Number(l.quantity) || 0, unitPrice: Number(l.unitPrice) || 0 }))
      .filter((it) => it.label.length > 0);
    if (items.length === 0) { setError("Ajoutez au moins une ligne avec un libellé."); return; }

    startTransition(async () => {
      const res = await createQuote({
        dealId,
        title: title.trim(),
        items,
        taxRate: taxPct,
        notes: notes.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormError message={error} />

      <Field label="Titre du devis" htmlFor="q-title" required>
        <Input
          id="q-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Refonte du site institutionnel — Phase 1"
        />
      </Field>

      {/* Éditeur de lignes */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-navy">Lignes du devis</span>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            <Plus size={15} /> Ajouter une ligne
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((l, idx) => (
            <div key={l.key} className="rounded-xl border border-navy/10 bg-surface-secondary/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted">Ligne {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeLine(l.key)}
                  disabled={lines.length <= 1}
                  aria-label="Supprimer la ligne"
                  className="grid h-7 w-7 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <Input
                value={l.label}
                onChange={(e) => updateLine(l.key, { label: e.target.value })}
                placeholder="Désignation de la prestation"
                aria-label={`Libellé ligne ${idx + 1}`}
              />
              <div className="mt-2 flex items-end gap-2">
                <div className="w-20 shrink-0 sm:w-24">
                  <span className="mb-1 block text-xs font-medium text-text-muted">Qté</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={l.quantity}
                    onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                    aria-label={`Quantité ligne ${idx + 1}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="mb-1 block text-xs font-medium text-text-muted">Prix unitaire (FCFA)</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1000}
                    value={l.unitPrice}
                    onChange={(e) => updateLine(l.key, { unitPrice: e.target.value })}
                    placeholder="0"
                    aria-label={`Prix unitaire ligne ${idx + 1}`}
                  />
                </div>
              </div>
              <p className="mt-2 text-right text-xs font-medium text-text-secondary">
                Sous-total : <span className="font-semibold text-navy">{formatFCFA(lineAmount(l))}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="TVA (%)" htmlFor="q-tax">
          <Input
            id="q-tax"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="any"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Validité (expiration)" htmlFor="q-expires">
          <Input
            id="q-expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </Field>
      </div>

      {/* Totaux */}
      <div className="rounded-xl border border-navy/[0.08] bg-surface-secondary/50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Sous-total</span>
          <span className="font-semibold text-navy">{formatFCFA(subtotal)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-sm">
          <span className="text-text-secondary">TVA ({taxPct}%)</span>
          <span className="font-semibold text-navy">{formatFCFA(tax)}</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-navy/[0.08] pt-2.5">
          <span className="font-display font-bold text-navy">Total</span>
          <span className="font-display text-lg font-extrabold text-brand-violet">{formatFCFA(total)}</span>
        </div>
      </div>

      <Field label="Notes" htmlFor="q-notes">
        <Textarea
          id="q-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Conditions, modalités de paiement, délais…"
        />
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-navy/[0.06] pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isPending}>Annuler</Button>
        <Button type="submit" variant="primary" loading={isPending} disabled={isPending}>
          Créer le devis
        </Button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════ ONGLET ACTIVITÉS ══════════════════════════ */

function ActivitiesTab({ deal }: { deal: DealDetail }) {
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
      const res = await logDealActivity({
        dealId: deal.id,
        type: type as ActivityType,
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
            <p className="text-xs text-text-secondary">Gardez une trace des échanges liés à cette opportunité.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <FormError message={error} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Type">
              <Select value={type} onChange={setType} options={ACTIVITY_TYPE_OPTIONS} ariaLabel="Type d'activité" />
            </Field>
            <Field label="Objet" htmlFor="da-subject" className="sm:col-span-2">
              <Input id="da-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex. Relance après envoi du devis" />
            </Field>
          </div>
          <Field label="Notes" htmlFor="da-notes">
            <Textarea id="da-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails de l'échange…" />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={isPending} disabled={isPending}>
              <Send size={16} /> Ajouter
            </Button>
          </div>
        </form>
      </Card>

      {/* Timeline */}
      {deal.activities.length === 0 ? (
        <EmptyState
          icon={<History size={22} />}
          title="Aucune activité"
          description="Les échanges journalisés apparaîtront ici, du plus récent au plus ancien."
        />
      ) : (
        <StaggerGroup className="space-y-3">
          {deal.activities.map((a) => {
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
                      <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDate(a.activityDate)}</span>
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
