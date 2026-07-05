import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { getClients, getAdminProjects } from "@/lib/admin-queries";
import { InvoiceForm } from "../InvoiceForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouvelle facture" };

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ projet?: string }>;
}) {
  const [{ projet }, clients, projects] = await Promise.all([
    searchParams,
    getClients(),
    getAdminProjects(),
  ]);

  // On ne transmet au formulaire que les infos utiles à la liaison projet↔client.
  const projectOptions = projects.map((p) => ({
    id: p.id,
    title: p.title,
    client: p.client,
  }));

  return (
    <>
      <Link
        href="/admin/factures"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux factures
      </Link>

      <AdminPageHeader
        title="Nouvelle facture"
        description="Composez les lignes de facturation. La facture est créée en brouillon — vous pourrez l’envoyer ensuite."
      />

      <InvoiceForm
        mode="create"
        clients={clients}
        projects={projectOptions}
        defaultProjectId={projet}
      />
    </>
  );
}
