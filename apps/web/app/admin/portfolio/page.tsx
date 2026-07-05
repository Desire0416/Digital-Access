import Link from "next/link";
import { Plus, FolderKanban, Star, ArrowUpRight } from "lucide-react";
import { cn, buttonClasses, formatDate, StaggerGroup, StaggerItem } from "@da/ui";
import {
  AdminPageHeader,
  EmptyState,
  PROJECT_TYPE,
} from "@/components/admin/ui";
import { getAdminPortfolio } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const items = await getAdminPortfolio();

  return (
    <>
      <AdminPageHeader
        title="Portfolio"
        description="Vos réalisations mises en avant sur le site vitrine — clients, technologies et projets vedettes."
      >
        <Link
          href="/admin/portfolio/nouveau"
          className={buttonClasses({ variant: "primary", size: "md" })}
        >
          <Plus className="h-4 w-4" />
          Nouvelle réalisation
        </Link>
      </AdminPageHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="Aucune réalisation pour l’instant"
          description="Présentez vos meilleurs projets pour convaincre vos futurs clients. Ajoutez votre première réalisation au portfolio."
        >
          <Link
            href="/admin/portfolio/nouveau"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            <Plus className="h-4 w-4" />
            Nouvelle réalisation
          </Link>
        </EmptyState>
      ) : (
        <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <StaggerItem key={item.id} className="h-full">
              <PortfolioCard item={item} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </>
  );
}

function PortfolioCard({
  item,
}: {
  item: {
    id: string;
    title: string;
    slug: string;
    client: string;
    type: string;
    featured: boolean;
    technologies: string[];
    createdAt: string;
  };
}) {
  const techShown = item.technologies.slice(0, 4);
  const techRest = item.technologies.length - techShown.length;

  return (
    <Link
      href={`/admin/portfolio/${item.id}/edit`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-5",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-violet/25 hover:shadow-xl",
      )}
    >
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-da transition-transform duration-300 group-hover:scale-x-100" />

      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da text-white">
          <FolderKanban className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-2">
          {item.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-1 text-[11px] font-semibold text-[#B45309]">
              <Star className="h-3 w-3 fill-current" />
              Vedette
            </span>
          )}
          <ArrowUpRight className="h-4 w-4 text-text-muted transition-colors group-hover:text-brand-violet" />
        </div>
      </div>

      <h3 className="mt-4 font-display text-lg font-bold leading-snug tracking-tight text-navy">
        {item.title}
      </h3>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
        <span className="font-medium text-navy/80">{item.client}</span>
        <span className="text-navy/20">•</span>
        <span>{PROJECT_TYPE[item.type] ?? item.type}</span>
      </div>

      {techShown.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {techShown.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-brand-violet/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-brand-violet"
            >
              {tech}
            </span>
          ))}
          {techRest > 0 && (
            <span className="rounded-full bg-navy/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
              +{techRest}
            </span>
          )}
        </div>
      )}

      <p className="mt-auto pt-4 text-xs text-text-muted">
        Ajoutée le {formatDate(item.createdAt)}
      </p>
    </Link>
  );
}
