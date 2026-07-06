"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  Receipt,
  UserRound,
  FolderKanban,
  CalendarClock,
  Percent,
  AlertCircle,
} from "lucide-react";
import { cn, buttonClasses, formatFCFA, Field, Input } from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { createInvoice, updateInvoice } from "@/lib/admin-actions";
import type { AdminInvoiceDetail } from "@/lib/admin-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Formulaire de facture — création & édition des lignes.
   Calcul en direct sous-total / TVA / total. En création : createInvoice puis
   redirection vers l'édition. En édition : updateInvoice puis router.refresh().
   ══════════════════════════════════════════════════════════════════════════ */

type ClientOption = { id: string; name: string; email: string };
type ProjectOption = {
  id: string;
  title: string;
  client: { id: string; name: string; email: string };
};

/** Ligne locale — les montants sont des chaînes pour un contrôle propre des inputs. */
type DraftLine = {
  key: string;
  label: string;
  quantity: string;
  unitPrice: string;
};

let lineSeq = 0;
function newLine(init?: Partial<DraftLine>): DraftLine {
  return {
    key: `l${lineSeq++}`,
    label: init?.label ?? "",
    quantity: init?.quantity ?? "1",
    unitPrice: init?.unitPrice ?? "",
  };
}

/** N'extrait que les chiffres → entier (les prix FCFA sont sans décimale). */
function toInt(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/** Déduit le taux de TVA (%) à partir du sous-total et de la taxe stockés. */
function inferTaxRate(amount: number, tax: number): string {
  if (amount <= 0 || tax <= 0) return "";
  const rate = Math.round((tax / amount) * 100);
  return String(rate);
}

export function InvoiceForm({
  mode = "create",
  invoice,
  clients,
  projects = [],
  defaultProjectId,
}: {
  mode?: "create" | "edit";
  invoice?: AdminInvoiceDetail;
  clients: ClientOption[];
  projects?: ProjectOption[];
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  // Pré-sélection projet → dérive le client associé si présent.
  const preProject = React.useMemo(
    () => (defaultProjectId ? projects.find((p) => p.id === defaultProjectId) : undefined),
    [defaultProjectId, projects],
  );

  const [clientId, setClientId] = React.useState<string>(
    invoice?.client.id ?? preProject?.client.id ?? "",
  );
  const [projectId, setProjectId] = React.useState<string>(
    invoice?.project?.id ?? preProject?.id ?? "",
  );
  const [dueDate, setDueDate] = React.useState<string>(
    invoice?.dueDate ? invoice.dueDate.slice(0, 10) : "",
  );
  const [taxRate, setTaxRate] = React.useState<string>(
    invoice ? inferTaxRate(invoice.amount, invoice.tax) : "",
  );
  const [lines, setLines] = React.useState<DraftLine[]>(() =>
    invoice && invoice.items.length > 0
      ? invoice.items.map((it) =>
          newLine({
            label: it.label,
            quantity: String(it.quantity),
            unitPrice: String(it.unitPrice),
          }),
        )
      : [newLine()],
  );

  // Projets filtrés par client sélectionné (on n'attache qu'un projet du client).
  const projectsForClient = React.useMemo(
    () => (clientId ? projects.filter((p) => p.client.id === clientId) : []),
    [clientId, projects],
  );

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, newLine()]);
  const removeLine = (key: string) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));

  // Sélection client : réinitialise le projet s'il n'appartient plus au client.
  const onClientChange = (value: string) => {
    setClientId(value);
    if (projectId && !projects.some((p) => p.id === projectId && p.client.id === value)) {
      setProjectId("");
    }
  };

  // Options du composant Select (portail) — client & projet associé.
  const clientOptions: SelectOption[] = React.useMemo(
    () => clients.map((c) => ({ value: c.id, label: `${c.name} — ${c.email}` })),
    [clients],
  );
  const projectSelectOptions: SelectOption[] = React.useMemo(
    () => projectsForClient.map((p) => ({ value: p.id, label: p.title })),
    [projectsForClient],
  );

  /* ── Calculs en direct ── */
  const amount = lines.reduce((s, l) => s + toInt(l.quantity) * toInt(l.unitPrice), 0);
  const rate = Math.min(100, Math.max(0, toInt(taxRate)));
  const tax = Math.round((amount * rate) / 100);
  const total = amount + tax;

  const canSubmit =
    (mode === "edit" || clientId !== "") &&
    lines.some((l) => l.label.trim() !== "" && toInt(l.quantity) > 0);

  const submit = () => {
    setError(null);
    setSaved(false);

    // Nettoyage : on ne garde que les lignes valides.
    const items = lines
      .filter((l) => l.label.trim() !== "" && toInt(l.quantity) > 0)
      .map((l) => ({
        label: l.label.trim(),
        quantity: toInt(l.quantity),
        unitPrice: toInt(l.unitPrice),
      }));

    if (items.length === 0) {
      setError("Ajoutez au moins une ligne valide (intitulé + quantité).");
      return;
    }

    startTransition(async () => {
      if (mode === "create") {
        if (!clientId) {
          setError("Sélectionnez un client.");
          return;
        }
        const res = await createInvoice({
          clientId,
          projectId: projectId || null,
          items,
          taxRate: rate,
          dueDate: dueDate || null,
          status: "DRAFT",
        });
        if (res.ok) {
          router.push(`/admin/factures/${res.id}/edit`);
        } else {
          setError(res.error);
        }
      } else {
        const res = await updateInvoice({
          id: invoice!.id,
          items,
          taxRate: rate,
          dueDate: dueDate || null,
        });
        if (res.ok) {
          setSaved(true);
          router.refresh();
          setTimeout(() => setSaved(false), 2500);
        } else {
          setError(res.error);
        }
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ─────────────── Colonne principale : destinataire + lignes ─────────────── */}
      <div className="flex flex-col gap-6">
        {/* Destinataire */}
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-white">
              <UserRound className="h-4 w-4" />
            </span>
            Destinataire
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Client" htmlFor="inv-client" required={mode === "create"}>
              {mode === "edit" ? (
                <div className="flex h-11 items-center rounded-lg border border-navy/10 bg-surface-secondary/60 px-4 text-sm font-semibold text-navy">
                  {invoice!.client.name}
                </div>
              ) : (
                <Select
                  value={clientId || null}
                  onChange={onClientChange}
                  options={clientOptions}
                  placeholder="Sélectionner un client…"
                  ariaLabel="Client"
                  disabled={pending}
                  buttonClassName="h-11"
                />
              )}
            </Field>

            <Field
              label="Projet associé"
              htmlFor="inv-project"
              hint={mode === "edit" ? undefined : "Optionnel — lie la facture à un projet."}
            >
              {mode === "edit" ? (
                <div className="flex h-11 items-center rounded-lg border border-navy/10 bg-surface-secondary/60 px-4 text-sm font-medium text-text-secondary">
                  <FolderKanban className="mr-2 h-4 w-4 shrink-0 text-text-muted" />
                  {invoice!.project ? invoice!.project.title : "Aucun projet lié"}
                </div>
              ) : (
                <Select
                  value={projectId || null}
                  onChange={setProjectId}
                  options={projectSelectOptions}
                  placeholder={
                    !clientId
                      ? "Choisissez d'abord un client"
                      : projectsForClient.length === 0
                        ? "Aucun projet pour ce client"
                        : "Aucun projet"
                  }
                  ariaLabel="Projet associé"
                  disabled={pending || !clientId || projectsForClient.length === 0}
                  buttonClassName="h-11"
                />
              )}
            </Field>
          </div>
        </section>

        {/* Lignes de facturation */}
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-white">
                <Receipt className="h-4 w-4" />
              </span>
              Lignes de facturation
            </h2>
            <span className="rounded-full bg-navy/[0.05] px-2.5 py-1 text-xs font-semibold text-text-secondary">
              {lines.length} ligne{lines.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* En-têtes de colonnes (desktop) */}
          <div className="mt-5 hidden grid-cols-[minmax(0,1fr)_84px_140px_140px_40px] gap-3 px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted sm:grid">
            <span>Intitulé</span>
            <span className="text-center">Qté</span>
            <span className="text-right">Prix unitaire</span>
            <span className="text-right">Montant</span>
            <span aria-hidden />
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:mt-0">
            <AnimatePresence initial={false} mode="popLayout">
              {lines.map((line) => {
                const lineTotal = toInt(line.quantity) * toInt(line.unitPrice);
                return (
                  <motion.div
                    key={line.key}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                    className="rounded-xl border border-navy/[0.07] bg-surface-secondary/40 p-3 sm:grid sm:grid-cols-[minmax(0,1fr)_84px_140px_140px_40px] sm:items-center sm:gap-3 sm:border-transparent sm:bg-transparent sm:p-1"
                  >
                    {/* Intitulé */}
                    <div className="sm:min-w-0">
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-muted sm:hidden">
                        Intitulé
                      </label>
                      <Input
                        value={line.label}
                        onChange={(e) => updateLine(line.key, { label: e.target.value })}
                        placeholder="Développement, hébergement, design…"
                        disabled={pending}
                      />
                    </div>

                    {/* Quantité + Prix (rangée mobile) */}
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:contents sm:mt-0">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-muted sm:hidden">
                          Quantité
                        </label>
                        <Input
                          inputMode="numeric"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.key, {
                              quantity: e.target.value.replace(/[^\d]/g, ""),
                            })
                          }
                          placeholder="1"
                          disabled={pending}
                          className="text-center"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-muted sm:hidden">
                          Prix unitaire
                        </label>
                        <Input
                          inputMode="numeric"
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateLine(line.key, {
                              unitPrice: e.target.value.replace(/[^\d]/g, ""),
                            })
                          }
                          placeholder="0"
                          disabled={pending}
                          className="text-right"
                        />
                      </div>
                    </div>

                    {/* Montant ligne */}
                    <div className="mt-3 flex items-center justify-between border-t border-navy/[0.06] pt-3 sm:mt-0 sm:justify-end sm:border-0 sm:pt-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted sm:hidden">
                        Montant
                      </span>
                      <span className="text-right font-display text-sm font-bold tabular-nums text-navy">
                        {formatFCFA(lineTotal)}
                      </span>
                    </div>

                    {/* Suppression */}
                    <div className="mt-3 flex justify-end sm:mt-0">
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        disabled={pending || lines.length <= 1}
                        aria-label="Supprimer la ligne"
                        title={lines.length <= 1 ? "Au moins une ligne requise" : "Supprimer la ligne"}
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-lg text-text-muted transition-colors",
                          "hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted",
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={addLine}
            disabled={pending}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-navy/20 px-3.5 py-2 text-sm font-semibold text-brand-blue-royal transition-colors hover:border-brand-cyan/50 hover:bg-brand-cyan/[0.04] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Ajouter une ligne
          </button>
        </section>
      </div>

      {/* ─────────────── Colonne latérale : totaux + paramètres + action ─────────────── */}
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        <section className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
          <div className="h-1 bg-gradient-da" />
          <div className="p-5">
            <h2 className="font-display text-sm font-bold text-navy">Récapitulatif</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-text-secondary">Sous-total</dt>
                <dd className="font-semibold tabular-nums text-navy">{formatFCFA(amount)}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-text-secondary">
                  <Percent className="h-3.5 w-3.5 text-text-muted" />
                  TVA
                </dt>
                <dd className="flex items-center gap-2">
                  <div className="relative w-20">
                    <Input
                      inputMode="numeric"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
                      placeholder="0"
                      disabled={pending}
                      aria-label="Taux de TVA en pourcentage"
                      className="h-9 pr-6 text-right text-sm"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">
                      %
                    </span>
                  </div>
                  <span className="min-w-[70px] text-right font-semibold tabular-nums text-navy">
                    {formatFCFA(tax)}
                  </span>
                </dd>
              </div>

              <div className="mt-1 flex items-center justify-between border-t border-navy/[0.08] pt-3">
                <dt className="font-display text-base font-bold text-navy">Total</dt>
                <dd className="font-display text-lg font-extrabold tabular-nums text-brand-blue-royal">
                  {formatFCFA(total)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-navy/[0.06] pt-4">
              <Field label="Échéance" htmlFor="inv-due" hint="Optionnel — date limite de règlement.">
                <div className="relative">
                  <Input
                    id="inv-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={pending}
                    className="pl-10"
                  />
                  <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                </div>
              </Field>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={pending || !canSubmit}
              className={cn(
                buttonClasses({ variant: "primary", size: "md" }),
                "mt-5 w-full disabled:opacity-50",
              )}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "create" ? "Création…" : "Enregistrement…"}
                </>
              ) : mode === "create" ? (
                <>
                  <Receipt className="h-4 w-4" />
                  Créer la facture
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-start gap-1.5 text-xs font-medium text-error"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </motion.p>
              ) : saved ? (
                <motion.p
                  key="ok"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success"
                >
                  <Save className="h-3.5 w-3.5" /> Modifications enregistrées
                </motion.p>
              ) : null}
            </AnimatePresence>

            {mode === "create" && (
              <p className="mt-3 text-center text-[11px] text-text-muted">
                Créée en brouillon — vous pourrez l’envoyer ensuite.
              </p>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
