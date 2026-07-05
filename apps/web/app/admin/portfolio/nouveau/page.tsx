import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { PortfolioForm } from "../PortfolioForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouvelle réalisation" };

export default function NewPortfolioPage() {
  return (
    <>
      <Link
        href="/admin/portfolio"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au portfolio
      </Link>

      <AdminPageHeader
        title="Nouvelle réalisation"
        description="Documentez un projet livré : client, technologies, visuels et témoignage. Elle apparaîtra dans le portfolio public."
      />

      <PortfolioForm />
    </>
  );
}
