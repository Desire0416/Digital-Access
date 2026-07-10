import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { getAdminTestimonial } from "@/lib/admin-queries";
import { TestimonialForm } from "../../TestimonialForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getAdminTestimonial(id);
  return { title: item ? `Témoignage — ${item.name}` : "Témoignage introuvable" };
}

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getAdminTestimonial(id);
  if (!item) notFound();

  const subtitle = [item.role, item.company].filter(Boolean).join(" · ");

  return (
    <div>
      <Link
        href="/admin/temoignages"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux témoignages
      </Link>

      {/* En-tête témoignage */}
      <header className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2.5 py-1 text-xs font-semibold text-text-secondary">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {item.rating}/5
              </span>
              {item.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-[#B45309]">
                  <Star className="h-3 w-3 fill-current" />
                  À la une
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {item.name}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
            )}
          </div>
        </div>
      </header>

      {/* Formulaire d'édition + suppression */}
      <div className="mt-6">
        <TestimonialForm mode="edit" item={item} />
      </div>
    </div>
  );
}
