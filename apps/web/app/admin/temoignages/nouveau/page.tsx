import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { TestimonialForm } from "../TestimonialForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouveau témoignage" };

export default function NewTestimonialPage() {
  return (
    <>
      <Link
        href="/admin/temoignages"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux témoignages
      </Link>

      <AdminPageHeader
        title="Nouveau témoignage"
        description="Ajoutez l’avis d’un client : auteur, fonction, note et citation. Il pourra être mis en avant sur la page d’accueil."
      />

      <TestimonialForm />
    </>
  );
}
