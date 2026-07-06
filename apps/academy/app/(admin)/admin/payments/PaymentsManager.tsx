"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Receipt, Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/admin/ui";
import { Select, type SelectOption } from "@/components/Select";
import { PaymentCard } from "./PaymentCard";
import { PaymentDetailPanel, type PanelMode } from "./PaymentDetailPanel";
import type { AdminPaymentItem } from "@/lib/payment-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Gestionnaire client des paiements : recherche (debounce → URL) + filtres
   <Select> (statut / type / fournisseur), liste responsive de cartes, et
   panneau de détail (portail) avec approbation / rejet. Tout l'état de filtre
   vit dans l'URL (searchParams) — le serveur refetch et recalcule les KPI.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "Tous les statuts" },
  { value: "PENDING", label: "En attente", dotColor: "#f59e0b" },
  { value: "COMPLETED", label: "Confirmés", dotColor: "#059669" },
  { value: "FAILED", label: "Échoués", dotColor: "#dc2626" },
  { value: "REFUNDED", label: "Remboursés", dotColor: "#9ca3af" },
];

const TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "Tous les types" },
  { value: "COURSE", label: "Cours", dotColor: "#5b3fa8" },
  { value: "SUBSCRIPTION", label: "Abonnements", dotColor: "#2b5cc6" },
  { value: "INVOICE", label: "Factures", dotColor: "#00bcd4" },
];

const PROVIDER_OPTIONS: SelectOption[] = [
  { value: "", label: "Tous les fournisseurs" },
  { value: "MANUAL", label: "Manuel (Mobile Money)" },
  { value: "CINETPAY", label: "CinetPay" },
  { value: "FEDAPAY", label: "FedaPay" },
  { value: "FREE", label: "Gratuit" },
];

export type PaymentFilterState = {
  q: string;
  status: string;
  type: string;
  provider: string;
};

type Selected = { id: string; mode: PanelMode } | null;

export function PaymentsManager({
  items,
  filters,
}: {
  items: AdminPaymentItem[];
  filters: PaymentFilterState;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();

  const [q, setQ] = React.useState(filters.q);
  const [selected, setSelected] = React.useState<Selected>(null);
  const firstRender = React.useRef(true);

  const pushParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      const qs = params.toString();
      router.replace(qs ? `/admin/payments?${qs}` : "/admin/payments", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  // Recherche texte : debounce 300 ms → URL.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      if (q.trim() !== filters.q) pushParam("q", q.trim());
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Resynchronise le champ si l'URL change (clic KPI, reset…).
  React.useEffect(() => {
    setQ(filters.q);
  }, [filters.q]);

  const hasFilter =
    !!filters.q || !!filters.status || !!filters.type || !!filters.provider;

  function resetAll() {
    setQ("");
    router.replace("/admin/payments", { scroll: false });
  }

  return (
    <div>
      {/* ── Recherche + filtres ──────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par apprenant, email ou référence (PAY-…)…"
              aria-label="Rechercher un paiement par apprenant, email ou référence"
              className="h-11 w-full rounded-xl border border-navy/[0.1] bg-surface-primary pl-10 pr-3 text-sm text-navy outline-none transition-colors placeholder:text-text-muted hover:border-navy/20 focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/25"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
            <Select
              value={filters.status || ""}
              onChange={(v) => pushParam("status", v)}
              options={STATUS_OPTIONS}
              placeholder="Statut"
              ariaLabel="Filtrer par statut"
              className="lg:w-40"
            />
            <Select
              value={filters.type || ""}
              onChange={(v) => pushParam("type", v)}
              options={TYPE_OPTIONS}
              placeholder="Type"
              ariaLabel="Filtrer par type"
              className="lg:w-40"
            />
            <Select
              value={filters.provider || ""}
              onChange={(v) => pushParam("provider", v)}
              options={PROVIDER_OPTIONS}
              placeholder="Fournisseur"
              ariaLabel="Filtrer par fournisseur"
              className="lg:w-52"
            />
          </div>
        </div>

        <AnimatePresence>
          {hasFilter && (
            <motion.div
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <SlidersHorizontal size={14} className="text-brand-blue-royal" />
                <span className="font-medium">
                  {items.length} paiement{items.length > 1 ? "s" : ""} affiché
                  {items.length > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2.5 py-1 text-xs font-semibold text-navy transition-colors hover:bg-navy/[0.09]"
                >
                  <X size={12} />
                  Réinitialiser
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Liste ────────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Receipt size={22} />}
          title={hasFilter ? "Aucun paiement trouvé" : "Aucun paiement"}
          description={
            hasFilter
              ? "Aucun paiement ne correspond à ces critères. Élargissez la recherche ou réinitialisez les filtres."
              : "Les paiements soumis par les apprenants apparaîtront ici, prêts à être vérifiés et approuvés."
          }
        >
          {hasFilter && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg"
            >
              <X size={15} />
              Réinitialiser les filtres
            </button>
          )}
        </EmptyState>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {items.map((p) => (
              <PaymentCard
                key={p.id}
                payment={p}
                onOpen={() => setSelected({ id: p.id, mode: "idle" })}
                onApprove={() =>
                  setSelected({ id: p.id, mode: "confirm-approve" })
                }
                onReject={() => setSelected({ id: p.id, mode: "reject" })}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Panneau de détail ────────────────────────────────────────────── */}
      {selected && (
        <PaymentDetailPanel
          key={selected.id}
          paymentId={selected.id}
          initialMode={selected.mode}
          onClose={() => setSelected(null)}
          onDone={() => router.refresh()}
        />
      )}
    </div>
  );
}
