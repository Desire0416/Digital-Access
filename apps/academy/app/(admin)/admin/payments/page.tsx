import type { Metadata } from "next";
import { Hourglass, CircleCheck } from "lucide-react";
import { Badge } from "@da/ui";
import { getAdminPayments } from "@/lib/payment-queries";
import { AdminPageHeader } from "@/components/admin/ui";
import { PaymentCard } from "./PaymentCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Validation des paiements",
  robots: { index: false, follow: false },
};

export default async function AdminPaymentsPage() {
  const { pending, processed } = await getAdminPayments();

  return (
    <div>
      <AdminPageHeader
        title="Validation des paiements"
        description="Comparez chaque preuve avec vos relevés Mobile Money avant d'approuver. L'approbation ouvre immédiatement l'accès au cours et notifie l'apprenant par email."
      />

      {/* En attente */}
      <div>
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-navy">
          <Hourglass size={18} className="text-warning" />
          En attente de vérification
          <Badge variant={pending.length > 0 ? "warning" : "default"}>{pending.length}</Badge>
        </h2>
        {pending.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-navy/15 bg-surface-primary/60 p-10 text-center">
            <CircleCheck size={32} className="mx-auto text-success" />
            <p className="mt-3 font-medium text-navy">Aucun paiement en attente</p>
            <p className="mt-1 text-sm text-text-secondary">
              Les nouvelles preuves de paiement apparaîtront ici — vous serez également notifié
              par email.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5">
            {pending.map((p) => (
              <PaymentCard key={p.id} payment={p} />
            ))}
          </div>
        )}
      </div>

      {/* Historique */}
      {processed.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-lg font-bold text-navy">Derniers paiements traités</h2>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {processed.map((p) => (
              <PaymentCard key={p.id} payment={p} readonly />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
