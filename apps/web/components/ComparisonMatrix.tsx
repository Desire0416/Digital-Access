"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { Badge, IconBadge, buttonClasses, cn } from "@da/ui";
import { Icon } from "@/components/Icon";

/** Une colonne = un pack/offre à comparer. */
export interface CompareColumn {
  id: string;
  name: string;
  icon?: string;
  featured?: boolean;
  badge?: string;
  cta?: { label: string; href: string };
}

/** Une ligne = un critère ; `values` alignées sur l'ordre des colonnes. */
export interface CompareRow {
  label: string;
  /** `boolean` → pastille ✓/– ; sinon contenu libre (texte, ReactNode). */
  values: (boolean | React.ReactNode)[];
}

/* Fonds opaques (indispensable pour les cellules `sticky` qui doivent
   masquer les lignes qui défilent derrière). */
const BG = {
  white: "#ffffff",
  stripe: "#f9fafb",
  featured: "#f1f7fd",
  cross: "#e5effb",
} as const;

function bgFor(featured: boolean, striped: boolean, crossed: boolean) {
  if (crossed) return BG.cross;
  if (featured) return BG.featured;
  if (striped) return BG.stripe;
  return BG.white;
}

/** Rend une valeur de cellule : pastille ✓/– pour un booléen, sinon le contenu. */
function CellValue({ value }: { value: boolean | React.ReactNode }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-da text-white">
        <Check size={14} strokeWidth={3} />
      </span>
    ) : (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy/[0.05] text-text-muted">
        <Minus size={14} strokeWidth={2.5} />
      </span>
    );
  }
  return <span className="text-sm font-medium text-navy">{value}</span>;
}

/**
 * Matrice de comparaison signature Digital Access.
 *
 * - Desktop (lg+) : tableau avec **en-tête figé** (les packs restent visibles
 *   au défilement) + **première colonne figée** (les critères restent visibles)
 *   + **surbrillance en croix** au survol (colonne ET ligne éclairées) pour ne
 *   jamais perdre de vue ce que l'on compare. La colonne « featured » forme une
 *   voie mise en avant en continu.
 * - Mobile (< lg) : une **carte empilée par pack** — aucun défilement horizontal.
 *
 * `stickyTopClass` positionne l'en-tête figé juste sous l'en-tête de site
 * (hauteur h-18 = 4.5rem).
 */
export function ComparisonMatrix({
  columns,
  rows,
  firstColLabel = "Détails",
  stickyTopClass = "top-[4.5rem]",
}: {
  columns: CompareColumn[];
  rows: CompareRow[];
  firstColLabel?: string;
  stickyTopClass?: string;
}) {
  // {row, col} survolé — row=-1 sur l'en-tête, col=-1 sur la colonne de critères.
  const [hover, setHover] = React.useState<{ row: number; col: number } | null>(
    null,
  );
  const isCrossed = (ri: number, ci: number) =>
    hover != null && (hover.col === ci || hover.row === ri);

  return (
    <>
      {/* ===================== Desktop : tableau figé (lg+) ===================== */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onMouseLeave={() => setHover(null)}
        className="hidden rounded-2xl border border-navy/[0.08] lg:block"
      >
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              {/* Coin figé (haut-gauche) */}
              <th
                scope="col"
                style={{ backgroundColor: BG.white }}
                className={cn(
                  "sticky left-0 z-30 rounded-tl-2xl border-b border-navy/[0.08] px-6 py-5 align-bottom",
                  stickyTopClass,
                )}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  {firstColLabel}
                </span>
              </th>

              {columns.map((col, ci) => {
                const crossed = hover?.col === ci;
                return (
                  <th
                    key={col.id}
                    scope="col"
                    style={{ backgroundColor: bgFor(!!col.featured, false, crossed) }}
                    onMouseEnter={() => setHover({ row: -1, col: ci })}
                    className={cn(
                      "sticky z-20 border-b border-navy/[0.08] px-5 py-5 text-center align-bottom transition-colors last:rounded-tr-2xl",
                      stickyTopClass,
                    )}
                  >
                    {col.icon && (
                      <span
                        className={cn(
                          "mx-auto mb-2.5 inline-flex h-11 w-11 items-center justify-center rounded-xl",
                          col.featured
                            ? "bg-gradient-da text-white shadow-brand"
                            : "bg-brand-blue-vif/10 text-brand-blue-royal",
                        )}
                      >
                        <Icon name={col.icon} size={20} />
                      </span>
                    )}
                    <span
                      className={cn(
                        "block font-display text-sm font-bold",
                        col.featured ? "text-brand-blue-royal" : "text-navy",
                      )}
                    >
                      {col.name}
                    </span>
                    {col.badge && (
                      <Badge variant="gradient" className="mt-2">
                        {col.badge}
                      </Badge>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, ri) => {
              const striped = ri % 2 === 1;
              const lastRow = ri === rows.length - 1;
              return (
                <tr key={row.label}>
                  {/* Critère (colonne figée à gauche) */}
                  <th
                    scope="row"
                    style={{ backgroundColor: bgFor(false, striped, hover?.row === ri) }}
                    onMouseEnter={() => setHover({ row: ri, col: -1 })}
                    className={cn(
                      "sticky left-0 z-10 px-6 py-4 text-sm font-semibold text-navy transition-colors",
                      !lastRow && "border-b border-navy/[0.05]",
                    )}
                  >
                    {row.label}
                  </th>

                  {row.values.map((value, ci) => {
                    const crossed = isCrossed(ri, ci);
                    return (
                      <td
                        key={columns[ci]?.id ?? ci}
                        style={{
                          backgroundColor: bgFor(
                            !!columns[ci]?.featured,
                            striped,
                            crossed,
                          ),
                        }}
                        onMouseEnter={() => setHover({ row: ri, col: ci })}
                        className={cn(
                          "px-5 py-4 text-center align-middle transition-colors",
                          !lastRow && "border-b border-navy/[0.05]",
                        )}
                      >
                        <CellValue value={value} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Ligne d'action (CTA par colonne) */}
            {columns.some((c) => c.cta) && (
              <tr>
                <th
                  scope="row"
                  style={{ backgroundColor: BG.white }}
                  className="sticky left-0 z-10 rounded-bl-2xl px-6 py-5"
                >
                  <span className="sr-only">Choisir un pack</span>
                </th>
                {columns.map((col, ci) => (
                  <td
                    key={col.id}
                    style={{
                      backgroundColor: bgFor(
                        !!col.featured,
                        false,
                        hover?.col === ci,
                      ),
                    }}
                    onMouseEnter={() => setHover({ row: -2, col: ci })}
                    className="px-5 py-5 text-center align-middle transition-colors last:rounded-br-2xl"
                  >
                    {col.cta && (
                      <Link
                        href={col.cta.href}
                        className={cn(
                          buttonClasses({
                            variant: col.featured ? "primary" : "outline",
                            size: "sm",
                          }),
                          "w-full",
                        )}
                      >
                        {col.cta.label}
                      </Link>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* ===================== Mobile : cartes empilées (< lg) ===================== */}
      <div className="grid grid-cols-1 gap-5 lg:hidden">
        {columns.map((col, ci) => (
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "overflow-hidden rounded-2xl border bg-surface-primary",
              col.featured
                ? "border-brand-blue-vif/40 shadow-brand"
                : "border-navy/[0.08]",
            )}
          >
            {/* En-tête de carte */}
            <div
              className={cn(
                "flex items-center gap-3 border-b p-5",
                col.featured
                  ? "border-brand-blue-vif/15 bg-brand-blue-vif/[0.05]"
                  : "border-navy/[0.06]",
              )}
            >
              {col.icon && (
                <IconBadge tone={col.featured ? "gradient" : "soft"} size="sm">
                  <Icon name={col.icon} size={18} />
                </IconBadge>
              )}
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-display text-base font-bold",
                    col.featured ? "text-brand-blue-royal" : "text-navy",
                  )}
                >
                  {col.name}
                </p>
                {col.badge && (
                  <Badge variant="gradient" className="mt-1">
                    {col.badge}
                  </Badge>
                )}
              </div>
            </div>

            {/* Critères */}
            <ul className="divide-y divide-navy/[0.05] px-5">
              {rows.map((row) => {
                const value = row.values[ci];
                const off = value === false;
                return (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className={off ? "text-text-muted" : "text-text-secondary"}>
                      {row.label}
                    </span>
                    <span className="shrink-0 text-right">
                      <CellValue value={value} />
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* CTA */}
            {col.cta && (
              <div className="p-5 pt-4">
                <Link
                  href={col.cta.href}
                  className={cn(
                    buttonClasses({
                      variant: col.featured ? "primary" : "outline",
                      size: "md",
                    }),
                    "w-full",
                  )}
                >
                  {col.cta.label}
                </Link>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </>
  );
}
