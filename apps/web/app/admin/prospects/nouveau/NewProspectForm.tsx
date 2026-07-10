"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Building2, Target, ArrowRight } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { AdminPageHeader } from "@/components/admin/ui";
import {
  ORG_TYPE_VALUES,
  ORG_TYPE_LABEL,
  PRIORITY_VALUES,
  PRIORITY_LABEL,
  type OrganizationType,
  type Priority,
  type DuplicateMatch,
  type AssignableUser,
} from "@/lib/crm-types";
import { createProspect, checkDuplicates } from "@/lib/crm-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Formulaire de création d'un prospect (organisation à démarcher + qualif).
   Détection de doublons non bloquante au blur du nom (+ site/email si saisis).
   ══════════════════════════════════════════════════════════════════════════ */

const DIGITAL_MATURITY_OPTIONS: SelectOption[] = [
  { value: "faible", label: "Faible" },
  { value: "moyenne", label: "Moyenne" },
  { value: "bonne", label: "Bonne" },
  { value: "avancée", label: "Avancée" },
];

const ORG_TYPE_OPTIONS: SelectOption[] = ORG_TYPE_VALUES.map((v) => ({
  value: v,
  label: ORG_TYPE_LABEL[v],
}));

const PRIORITY_OPTIONS: SelectOption[] = PRIORITY_VALUES.map((v) => ({
  value: v,
  label: PRIORITY_LABEL[v],
}));

export function NewProspectForm({
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
  const [isChecking, startCheck] = React.useTransition();

  // Champs Organisation
  const [orgName, setOrgName] = React.useState("");
  const [orgType, setOrgType] = React.useState<OrganizationType>("COMPANY");
  const [sector, setSector] = React.useState("");
  const [city, setCity] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");

  // Champs Qualification
  const [source, setSource] = React.useState("");
  const [priority, setPriority] = React.useState<Priority | null>(null);
  const [recommendedOffer, setRecommendedOffer] = React.useState("");
  const [mainObservedNeed, setMainObservedNeed] = React.useState("");
  const [digitalMaturity, setDigitalMaturity] = React.useState<string | null>(null);
  const [estimatedPotential, setEstimatedPotential] = React.useState("");

  // Attribution
  const [assigneeId, setAssigneeId] = React.useState<string>(defaultAssigneeId);

  // Retours serveur
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = React.useState<DuplicateMatch[]>([]);

  const assignableOptions: SelectOption[] = assignable.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  function runDuplicateCheck() {
    const name = orgName.trim();
    if (!name) return;
    startCheck(async () => {
      try {
        const matches = await checkDuplicates({
          name,
          website: website.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        setDuplicates(matches);
      } catch {
        setDuplicates([]);
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending || !orgName.trim()) return;
    setFormError(null);
    setFieldErrors({});

    const potentialRaw = estimatedPotential.trim();
    const potentialNum = potentialRaw === "" ? undefined : Number(potentialRaw);

    startTransition(async () => {
      const res = await createProspect({
        orgName: orgName.trim(),
        orgType,
        sector: sector.trim() || undefined,
        city: city.trim() || undefined,
        website: website.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        source: source.trim() || undefined,
        priority: priority ?? undefined,
        recommendedOffer: recommendedOffer.trim() || undefined,
        mainObservedNeed: mainObservedNeed.trim() || undefined,
        digitalMaturity: digitalMaturity ?? undefined,
        estimatedPotential:
          potentialNum !== undefined && Number.isFinite(potentialNum) ? potentialNum : undefined,
        assignedToId: canAssign ? assigneeId || undefined : undefined,
      });

      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      router.push(`/admin/prospects/${res.prospectId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AdminPageHeader
        title="Nouveau prospect"
        description="Identifiez une structure à démarcher et lancez son suivi commercial."
      />

      {/* Alerte doublons — non bloquante */}
      <AnimatePresence>
        {duplicates.length > 0 && (
          <motion.div
            key="dup-alert"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 overflow-hidden"
          >
            <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning/20 text-[#B45309]">
                  <AlertTriangle size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-[#B45309]">
                    Une organisation similaire existe déjà
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Vérifiez avant de créer un doublon. La création reste possible.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {duplicates.map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/25 bg-surface-primary/70 px-3 py-2"
                      >
                        <span className="min-w-0 text-sm text-navy">
                          <span className="font-semibold">{d.name}</span>{" "}
                          <span className="text-text-muted">({d.reason})</span>
                        </span>
                        <Link
                          href={`/admin/prospects?q=${encodeURIComponent(d.name)}`}
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                        >
                          consulter <ArrowRight size={13} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Erreur globale */}
      {formError && (
        <div className="mb-6 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error">
          {formError}
        </div>
      )}

      <div className="space-y-6">
        {/* ─── Section 1 : Organisation ─────────────────────────────────── */}
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
              <Building2 size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-navy">Organisation</h2>
              <p className="text-xs text-text-secondary">La structure à démarcher.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Nom de l'organisation"
              htmlFor="orgName"
              required
              error={fieldErrors.orgName}
              className="sm:col-span-2"
            >
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                onBlur={runDuplicateCheck}
                error={!!fieldErrors.orgName}
                placeholder="Ex. Boutique Élégance"
                autoComplete="organization"
              />
            </Field>

            <Field label="Type d'organisation" error={fieldErrors.orgType}>
              <Select
                value={orgType}
                onChange={(v) => setOrgType(v as OrganizationType)}
                options={ORG_TYPE_OPTIONS}
                ariaLabel="Type d'organisation"
              />
            </Field>

            <Field label="Secteur d'activité" htmlFor="sector" error={fieldErrors.sector}>
              <Input
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                error={!!fieldErrors.sector}
                placeholder="Ex. Mode & textile"
              />
            </Field>

            <Field label="Ville" htmlFor="city" error={fieldErrors.city}>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={!!fieldErrors.city}
                placeholder="Ex. Abidjan"
                autoComplete="address-level2"
              />
            </Field>

            <Field label="Site web" htmlFor="website" error={fieldErrors.website}>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                onBlur={runDuplicateCheck}
                error={!!fieldErrors.website}
                placeholder="https://exemple.ci"
                autoComplete="url"
              />
            </Field>

            <Field label="Email" htmlFor="email" error={fieldErrors.email}>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={runDuplicateCheck}
                error={!!fieldErrors.email}
                placeholder="contact@exemple.ci"
                autoComplete="email"
              />
            </Field>

            <Field label="Téléphone" htmlFor="phone" error={fieldErrors.phone}>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={!!fieldErrors.phone}
                placeholder="+225 07 00 00 00 00"
                autoComplete="tel"
              />
            </Field>

            <Field label="WhatsApp" htmlFor="whatsapp" error={fieldErrors.whatsapp}>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                error={!!fieldErrors.whatsapp}
                placeholder="+225 07 00 00 00 00"
              />
            </Field>
          </div>

          {isChecking && (
            <p className="mt-3 text-xs font-medium text-text-muted">Recherche de doublons…</p>
          )}
        </Card>

        {/* ─── Section 2 : Qualification ────────────────────────────────── */}
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-cyan/15 text-[#0891a6]">
              <Target size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-navy">Qualification</h2>
              <p className="text-xs text-text-secondary">
                Potentiel commercial et besoin observé.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Source" htmlFor="source" error={fieldErrors.source}>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                error={!!fieldErrors.source}
                placeholder="Ex. Prospection terrain, salon…"
              />
            </Field>

            <Field label="Priorité" error={fieldErrors.priority}>
              <Select
                value={priority}
                onChange={(v) => setPriority(v as Priority)}
                options={PRIORITY_OPTIONS}
                placeholder="Non définie"
                ariaLabel="Priorité"
              />
            </Field>

            <Field
              label="Offre recommandée"
              htmlFor="recommendedOffer"
              error={fieldErrors.recommendedOffer}
              className="sm:col-span-2"
            >
              <Input
                id="recommendedOffer"
                value={recommendedOffer}
                onChange={(e) => setRecommendedOffer(e.target.value)}
                error={!!fieldErrors.recommendedOffer}
                placeholder="Ex. Pack Site vitrine + maintenance"
              />
            </Field>

            <Field
              label="Besoin principal observé"
              htmlFor="mainObservedNeed"
              error={fieldErrors.mainObservedNeed}
              className="sm:col-span-2"
            >
              <Textarea
                id="mainObservedNeed"
                value={mainObservedNeed}
                onChange={(e) => setMainObservedNeed(e.target.value)}
                error={!!fieldErrors.mainObservedNeed}
                placeholder="Décrivez le besoin numérique constaté (absence de site, image datée, faible visibilité…)."
              />
            </Field>

            <Field label="Maturité numérique" error={fieldErrors.digitalMaturity}>
              <Select
                value={digitalMaturity}
                onChange={(v) => setDigitalMaturity(v)}
                options={DIGITAL_MATURITY_OPTIONS}
                placeholder="Non évaluée"
                ariaLabel="Maturité numérique"
              />
            </Field>

            <Field
              label="Potentiel estimé (FCFA)"
              htmlFor="estimatedPotential"
              hint="Montant approximatif du budget mobilisable."
              error={fieldErrors.estimatedPotential}
            >
              <Input
                id="estimatedPotential"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={estimatedPotential}
                onChange={(e) => setEstimatedPotential(e.target.value)}
                error={!!fieldErrors.estimatedPotential}
                placeholder="Ex. 500000"
              />
            </Field>
          </div>

          {canAssign && (
            <div className="mt-4 border-t border-navy/[0.07] pt-4">
              <Field
                label="Responsable"
                hint="Commercial en charge du suivi de ce prospect."
                error={fieldErrors.assignedToId}
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
            </div>
          )}
        </Card>

        {/* ─── Actions ──────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/admin/prospects"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
          >
            Annuler
          </Link>
          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            disabled={isPending || !orgName.trim()}
          >
            Créer le prospect
          </Button>
        </div>
      </div>
    </form>
  );
}
