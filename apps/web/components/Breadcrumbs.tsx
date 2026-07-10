import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, type Crumb } from "@/lib/structured-data";

/**
 * Fil d'Ariane brandé + données structurées BreadcrumbList.
 * Passer la chaîne complète depuis l'accueil, ex. :
 *   [{ name: "Accueil", path: "/" }, { name: "Services", path: "/services" }, { name: "Création de site web", path: "/services/creation-site-web" }]
 * Le dernier élément est la page courante (non cliquable).
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={`flex items-center gap-1.5 text-sm text-text-secondary ${className ?? ""}`}
    >
      <JsonLd data={breadcrumbSchema(items)} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden />}
              {isLast ? (
                <span className="font-semibold text-navy" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="inline-flex items-center gap-1 rounded transition-colors hover:text-brand-blue-royal"
                >
                  {i === 0 && <Home className="h-3.5 w-3.5" aria-hidden />}
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
