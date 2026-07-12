import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { getMyPortfolioEditor } from "@/lib/portfolio-queries";
import { ensurePortfolio } from "@/lib/portfolio-actions";
import { EspaceHeader } from "@/components/espace/parts";
import { EmptyState } from "@/components/EmptyState";
import { PortfolioEditor } from "./PortfolioEditor";

export const metadata: Metadata = { title: "Mon portfolio" };

export default async function PortfolioEditorPage() {
  const user = await requireUser("/espace/portfolio");

  // Garantit l'existence du portfolio (création idempotente) avant chargement.
  await ensurePortfolio();
  const data = await getMyPortfolioEditor(user.id);

  return (
    <div className="max-w-4xl">
      <EspaceHeader
        title="Mon portfolio"
        subtitle="Construisez votre vitrine professionnelle : présentation, projets validés, expériences et certificats vérifiables."
      />

      {data.portfolio ? (
        <>
          {/* Lien vers le portfolio public + rappel de visibilité */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/[0.07] bg-surface-secondary/40 p-4">
            <span
              className={`inline-flex items-center gap-2 text-sm font-semibold ${
                data.portfolio.isPublic ? "text-success" : "text-text-secondary"
              }`}
            >
              {data.portfolio.isPublic ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
              {data.portfolio.isPublic ? "Portfolio public" : "Portfolio privé"}
            </span>
            {data.portfolio.isPublic ? (
              <Link
                href={`/portfolio/${data.portfolio.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
              >
                <ExternalLink size={15} aria-hidden />
                Voir mon portfolio public
              </Link>
            ) : (
              <span className="text-xs text-text-muted">
                Rendez-le public (ci-dessous) pour obtenir un lien partageable.
              </span>
            )}
          </div>

          <PortfolioEditor
            portfolio={data.portfolio}
            items={data.items}
            publishableProjects={data.publishableProjects}
          />
        </>
      ) : (
        <EmptyState
          title="Portfolio indisponible"
          description="Nous n'avons pas pu initialiser votre portfolio. Rechargez la page ou réessayez plus tard."
        />
      )}
    </div>
  );
}
