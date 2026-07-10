"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Rocket, CheckCircle2, XCircle, AlertTriangle, Check } from "lucide-react";
import { Button, Card, Field, Input, Textarea, cn } from "@da/ui";
import { Select } from "@/components/Select";
import { Modal } from "@/components/admin/Modal";
import { requestConversion, reviewConversion } from "@/lib/crm-conversion-actions";
import type { DealDetail, AssignableUser } from "@/lib/crm-types";

const PROJECT_TYPE_OPTIONS = [
  { value: "SITE_VITRINE", label: "Site vitrine" },
  { value: "SITE_INSTITUTIONNEL", label: "Site institutionnel" },
  { value: "ELEARNING", label: "E-learning" },
  { value: "REFONTE", label: "Refonte" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OTHER", label: "Autre" },
];
const REQUESTABLE = ["VERBAL_AGREEMENT", "DEPOSIT_PENDING", "WON"];

export function ConversionActions({
  deal,
  canRequest,
  canValidate,
  projectManagers,
}: {
  deal: DealDetail;
  canRequest: boolean;
  canValidate: boolean;
  projectManagers: AssignableUser[];
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [pmId, setPmId] = React.useState("");
  const [projectType, setProjectType] = React.useState("OTHER");
  const [budget, setBudget] = React.useState(deal.estimatedAmount != null ? String(deal.estimatedAmount) : "");

  const hasAcceptedQuote = deal.quotes.some((q) => q.status === "ACCEPTED");
  const checklist = [
    { ok: REQUESTABLE.includes(deal.stage), label: "Étape en accord verbal, acompte attendu ou gagnée" },
    { ok: !!deal.primaryContact, label: "Un contact principal renseigné" },
    { ok: deal.estimatedAmount != null || hasAcceptedQuote, label: "Un montant ou un devis accepté" },
    { ok: !!deal.recommendedOffer, label: "Une offre identifiée" },
  ];
  const ready = checklist.every((c) => c.ok);

  const doRequest = () =>
    start(async () => {
      setError(null);
      const r = await requestConversion({ dealId: deal.id });
      if (r.ok) router.refresh();
      else setError(r.error);
    });

  const doValidate = () =>
    start(async () => {
      setError(null);
      const r = await reviewConversion({
        dealId: deal.id, decision: "validate",
        projectManagerId: pmId || undefined, projectType, budget: budget ? Number(budget) : undefined,
      });
      if (r.ok) {
        if (r.projectId) router.push(`/admin/projets/${r.projectId}`);
        else router.refresh();
      } else setError(r.error);
    });

  const doReject = () =>
    start(async () => {
      if (!note.trim()) return;
      setError(null);
      const r = await reviewConversion({ dealId: deal.id, decision: "reject", note });
      if (r.ok) { setRejectOpen(false); router.refresh(); }
      else setError(r.error);
    });

  if (deal.conversionStatus === "VALIDATED") return null;

  /* ── Admin : dossier à valider ── */
  if (deal.conversionStatus === "PENDING" && canValidate) {
    return (
      <Card interactive={false} className="border-brand-violet/20 bg-gradient-to-br from-brand-violet/[0.05] to-brand-cyan/[0.05] p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy">
          <Rocket size={18} className="text-brand-violet" /> Valider la conversion en projet
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Créez le projet à partir de cette opportunité (le contact, l'audit et le devis sont transférés automatiquement), ou refusez avec un motif.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Chef de projet">
            <Select
              value={pmId || ""}
              onChange={setPmId}
              placeholder="À attribuer plus tard"
              options={[{ value: "", label: "À attribuer plus tard" }, ...projectManagers.map((u) => ({ value: u.id, label: u.name }))]}
              ariaLabel="Chef de projet"
            />
          </Field>
          <Field label="Type de projet">
            <Select value={projectType} onChange={setProjectType} options={PROJECT_TYPE_OPTIONS} ariaLabel="Type de projet" />
          </Field>
          <Field label="Budget (FCFA)">
            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Auto (devis / montant)" />
          </Field>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={doValidate} loading={pending}><CheckCircle2 size={17} /> Valider — créer le projet</Button>
          <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={pending}><XCircle size={17} /> Refuser</Button>
        </div>

        <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Refuser la conversion" size="md"
          footer={<div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={pending}>Annuler</Button>
            <Button onClick={doReject} loading={pending} disabled={note.trim().length < 3}>Refuser</Button>
          </div>}>
          <Field label="Motif du refus" required>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Expliquez au commercial ce qui manque…" />
          </Field>
        </Modal>
      </Card>
    );
  }

  /* ── Commercial : demander la conversion ── */
  if ((deal.conversionStatus === "NOT_REQUESTED" || deal.conversionStatus === "REJECTED") && canRequest) {
    return (
      <Card interactive={false} className="p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy">
          <Rocket size={18} className="text-brand-blue-royal" /> Convertir en projet
        </h3>
        {deal.conversionStatus === "REJECTED" && deal.conversionNote && (
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-error/[0.06] px-3 py-2 text-sm text-error">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" /> <span><span className="font-semibold">Refusé :</span> {deal.conversionNote}</span>
          </p>
        )}
        <p className="mt-1 text-sm text-text-secondary">
          Une fois l'opportunité aboutie, demandez sa conversion. Un administrateur validera puis créera le projet.
        </p>
        <ul className="mt-4 space-y-1.5">
          {checklist.map((c, i) => (
            <li key={i} className={cn("flex items-center gap-2 text-sm", c.ok ? "text-navy" : "text-text-muted")}>
              <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full", c.ok ? "bg-success text-white" : "border border-navy/20")}>
                {c.ok && <Check size={12} />}
              </span>
              {c.label}
            </li>
          ))}
        </ul>
        {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}
        <Button className="mt-4" onClick={doRequest} loading={pending} disabled={!ready}>
          <Rocket size={17} /> Demander la conversion
        </Button>
      </Card>
    );
  }

  return null;
}
