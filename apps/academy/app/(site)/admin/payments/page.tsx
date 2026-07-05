import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hourglass, CircleCheck } from "lucide-react";
import { Container, GradientText, Badge } from "@da/ui";
import { currentUser, hasRole } from "@da/auth/guards";
import { getAdminPayments } from "@/lib/payment-queries";
import { PaymentCard } from "./PaymentCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Validation des paiements",
  robots: { index: false, follow: false },
};

export default async function AdminPaymentsPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/admin/payments");
  if (!hasRole(user, "ADMIN", "SUPER_ADMIN")) redirect("/dashboard");

  const { pending, processed } = await getAdminPayments();

  return (
    <section className="relative isolate overflow-hidden pb-20 pt-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand-violet/10 blur-[110px]" />
      </div>

      <Container size="lg">
        <span className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal">
          <span className="h-px w-7 bg-gradient-da" />
          Administration Academy
        </span>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Validation des <GradientText>paiements</GradientText>
        </h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Comparez chaque preuve avec vos relevés Mobile Money avant d'approuver.
          L'approbation ouvre immédiatement l'accès au cours et notifie
          l'apprenant par email.
        </p>

        {/* En attente */}
        <div className="mt-10">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-navy">
            <Hourglass size={18} className="text-warning" />
            En attente de vérification
            <Badge variant={pending.length > 0 ? "warning" : "default"}>
              {pending.length}
            </Badge>
          </h2>
          {pending.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/50 p-10 text-center">
              <CircleCheck size={32} className="mx-auto text-success" />
              <p className="mt-3 font-medium text-navy">Aucun paiement en attente</p>
              <p className="mt-1 text-sm text-text-secondary">
                Les nouvelles preuves de paiement apparaîtront ici — vous serez
                également notifié par email.
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
          <div className="mt-14">
            <h2 className="font-display text-lg font-bold text-navy">
              Derniers paiements traités
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4">
              {processed.map((p) => (
                <PaymentCard key={p.id} payment={p} readonly />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
