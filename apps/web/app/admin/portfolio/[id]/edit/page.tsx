import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, ExternalLink } from "lucide-react";
import { StatusPill } from "@/components/admin/ui";
import { getAdminPortfolioItem } from "@/lib/admin-queries";
import { PortfolioForm } from "../../PortfolioForm";
import { PROJECT_TYPE } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getAdminPortfolioItem(id);
  return { title: item ? item.title : "Réalisation introuvable" };
}

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getAdminPortfolioItem(id);
  if (!item) notFound();

  return (
    <div>
      <Link
        href="/admin/portfolio"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au portfolio
      </Link>

      {/* En-tête réalisation */}
      <header className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusPill
                label={PROJECT_TYPE[item.type] ?? item.type}
                tone="violet"
                dot={false}
              />
              {item.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-[#B45309]">
                  <Star className="h-3 w-3 fill-current" />
                  En vedette
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {item.title}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Client&nbsp;: <span className="font-semibold text-navy">{item.client}</span>
              {" · "}
              <span className="font-mono text-xs text-text-muted">/{item.slug}</span>
            </p>
          </div>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-navy/[0.1] bg-surface-secondary/60 px-3.5 py-2 text-sm font-semibold text-brand-blue-royal transition-colors hover:bg-surface-secondary"
            >
              <ExternalLink className="h-4 w-4" />
              Voir en ligne
            </a>
          )}
        </div>
      </header>

      {/* Formulaire d'édition + suppression */}
      <div className="mt-6">
        <PortfolioForm mode="edit" item={item} />
      </div>
    </div>
  );
}
