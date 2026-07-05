import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  ArrowRight,
  Wallet,
  CircleCheckBig,
  Receipt,
  Sparkles,
} from "lucide-react";
import {
  Container,
  Section,
  Badge,
  IconBadge,
  buttonClasses,
  cn,
  formatFCFA,
  formatDate,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getClientInvoices, type InvoiceStatus } from "@/lib/portal-queries";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Mes factures",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const invoiceStatus: Record<
  InvoiceStatus,
  { label: string; variant: "warning" | "success" | "default" }
> = {
  SENT: { label: "À payer", variant: "warning" },
  OVERDUE: { label: "En retard", variant: "warning" },
  PAID: { label: "Payée", variant: "success" },
  DRAFT: { label: "Brouillon", variant: "default" },
  CANCELLED: { label: "Annulée", variant: "default" },
};

export default async function FacturesPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/factures");

  const invoices = await getClientInvoices(user.id);

  // Récapitulatif calculé côté serveur.
  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.total, 0);
  const totalDue = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.total, 0);
  const hasInvoices = invoices.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Espace client"
        title={
          <>
            Mes <span className="text-gradient-da">factures</span>
          </>
        }
        description="Consultez et téléchargez toutes vos factures Digital Access. Réglez vos échéances en toute simplicité."
      />

      <Section spacing="md" className="pt-0">
        <Container>
          {/* Récapitulatif */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
              <div className="flex items-center justify-between">
                <IconBadge tone="soft" className="bg-success/12 text-success">
                  <CircleCheckBig size={20} />
                </IconBadge>
                <span className="font-display text-2xl font-extrabold text-navy sm:text-3xl">
                  {formatFCFA(totalPaid)}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-text-secondary">
                Total réglé
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
              <div
                aria-hidden
                className={cn(
                  "absolute inset-x-0 top-0 h-1",
                  totalDue > 0 ? "bg-gradient-da" : "bg-navy/[0.06]",
                )}
              />
              <div className="flex items-center justify-between">
                <IconBadge
                  tone="soft"
                  className={
                    totalDue > 0
                      ? "bg-warning/15 text-[#B45309]"
                      : "bg-navy/[0.06] text-text-secondary"
                  }
                >
                  <Wallet size={20} />
                </IconBadge>
                <span className="font-display text-2xl font-extrabold text-navy sm:text-3xl">
                  {formatFCFA(totalDue)}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-text-secondary">
                Reste à payer
              </p>
            </div>
          </div>

          {/* Liste des factures */}
          {hasInvoices ? (
            <div className="mt-10">
              <div className="mb-4 flex items-center gap-2">
                <Receipt size={18} className="text-brand-blue-royal" />
                <h2 className="font-display text-lg font-bold text-navy">
                  Historique des factures
                </h2>
                <span className="text-sm text-text-muted">
                  ({invoices.length})
                </span>
              </div>

              {/* Tableau — desktop */}
              <div className="hidden overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-navy/[0.07] bg-surface-secondary/60 text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-5 py-3.5 font-semibold">Numéro</th>
                      <th className="px-5 py-3.5 font-semibold">Projet</th>
                      <th className="px-5 py-3.5 font-semibold">Émission</th>
                      <th className="px-5 py-3.5 font-semibold">Échéance</th>
                      <th className="px-5 py-3.5 text-right font-semibold">
                        Montant
                      </th>
                      <th className="px-5 py-3.5 font-semibold">Statut</th>
                      <th className="px-5 py-3.5 text-right font-semibold">
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const st = invoiceStatus[inv.status];
                      return (
                        <tr
                          key={inv.id}
                          className="group border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-brand-blue-vif/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-semibold text-navy">
                              {inv.number}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-text-secondary">
                            {inv.projectTitle ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-text-secondary">
                            {formatDate(inv.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-text-secondary">
                            {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                          </td>
                          <td className="px-5 py-4 text-right font-display font-bold text-navy">
                            {formatFCFA(inv.total)}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/factures/${inv.id}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                            >
                              Voir
                              <ArrowRight
                                size={15}
                                className="transition-transform group-hover:translate-x-0.5"
                              />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cartes — mobile */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {invoices.map((inv) => {
                  const st = invoiceStatus[inv.status];
                  return (
                    <Link
                      key={inv.id}
                      href={`/factures/${inv.id}`}
                      className="group block rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs font-semibold text-brand-blue-royal">
                            {inv.number}
                          </p>
                          <p className="mt-1 font-display text-base font-bold text-navy">
                            {inv.projectTitle ?? "Facture"}
                          </p>
                        </div>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <div className="text-xs text-text-muted">
                          <p>Émise le {formatDate(inv.createdAt)}</p>
                          {inv.dueDate && (
                            <p>Échéance {formatDate(inv.dueDate)}</p>
                          )}
                        </div>
                        <span className="font-display text-lg font-extrabold text-navy">
                          {formatFCFA(inv.total)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-blue-royal">
                        Voir la facture
                        <ArrowRight
                          size={15}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/50 p-12 text-center">
              <IconBadge tone="gradient" size="lg" className="mx-auto">
                <FileText size={24} />
              </IconBadge>
              <p className="mt-4 font-display text-lg font-bold text-navy">
                Aucune facture pour le moment
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
                Vos factures apparaîtront ici dès qu'un projet démarrera avec
                Digital Access. Demandez un devis pour lancer votre projet.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/devis"
                  className={cn(buttonClasses({ variant: "primary", size: "md" }))}
                >
                  Demander un devis
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href="/mon-espace"
                  className={cn(buttonClasses({ variant: "outline", size: "md" }))}
                >
                  <Sparkles size={16} />
                  Mon espace
                </Link>
              </div>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
