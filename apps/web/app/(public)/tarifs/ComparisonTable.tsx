"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { buttonClasses, cn } from "@da/ui";
import { Icon } from "@/components/Icon";

/** Ligne du tableau comparatif : présence du livrable par pack (indices alignés sur `packs`). */
export interface ComparisonRow {
  label: string;
  values: boolean[];
}

export interface ComparisonPack {
  id: string;
  name: string;
  icon: string;
  featured?: boolean;
}

/**
 * Tableau comparatif des livrables — sticky de la colonne « fonctionnalité »,
 * scroll horizontal sur mobile, colonne featured surlignée en dégradé.
 */
export function ComparisonTable({
  packs,
  rows,
}: {
  packs: ComparisonPack[];
  rows: ComparisonRow[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface-primary p-5 align-bottom">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                  Livrables
                </span>
              </th>
              {packs.map((pack) => (
                <th
                  key={pack.id}
                  className={cn(
                    "min-w-[150px] p-5 text-center align-bottom",
                    pack.featured && "bg-brand-blue-vif/[0.06]",
                  )}
                >
                  <span
                    className={cn(
                      "mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl",
                      pack.featured
                        ? "bg-gradient-da text-white shadow-brand"
                        : "bg-brand-blue-vif/10 text-brand-blue-royal",
                    )}
                  >
                    <Icon name={pack.icon} size={20} />
                  </span>
                  <span
                    className={cn(
                      "block font-display text-sm font-bold",
                      pack.featured ? "text-brand-blue-royal" : "text-navy",
                    )}
                  >
                    {pack.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={row.label}
                className={cn(
                  "border-t border-navy/[0.06]",
                  ri % 2 === 1 && "bg-surface-secondary/60",
                )}
              >
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-10 p-5 text-sm font-medium text-navy",
                    ri % 2 === 1
                      ? "bg-[#fbfcfd]"
                      : "bg-surface-primary",
                  )}
                >
                  {row.label}
                </th>
                {row.values.map((included, ci) => (
                  <td
                    key={packs[ci]?.id ?? ci}
                    className={cn(
                      "p-5 text-center",
                      packs[ci]?.featured && "bg-brand-blue-vif/[0.06]",
                    )}
                  >
                    {included ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-da text-white">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy/[0.05] text-text-muted">
                        <Minus size={14} strokeWidth={2.5} />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-navy/[0.06]">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-surface-primary p-5"
              >
                <span className="sr-only">Actions</span>
              </th>
              {packs.map((pack) => (
                <td
                  key={pack.id}
                  className={cn(
                    "p-5 text-center",
                    pack.featured && "bg-brand-blue-vif/[0.06]",
                  )}
                >
                  <Link
                    href="/devis"
                    className={cn(
                      buttonClasses({
                        variant: pack.featured ? "primary" : "outline",
                        size: "sm",
                      }),
                      "w-full",
                    )}
                  >
                    Choisir
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
