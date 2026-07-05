"use client";

import {
  ComparisonMatrix,
  type CompareColumn,
  type CompareRow,
} from "@/components/ComparisonMatrix";

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
 * Comparatif des livrables par pack. S'appuie sur la matrice signature
 * `ComparisonMatrix` : en-tête et critères figés au défilement + surbrillance
 * en croix sur desktop, cartes empilées sur mobile.
 */
export function ComparisonTable({
  packs,
  rows,
}: {
  packs: ComparisonPack[];
  rows: ComparisonRow[];
}) {
  const columns: CompareColumn[] = packs.map((p) => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    featured: p.featured,
    badge: p.featured ? "Le plus choisi" : undefined,
    cta: { label: "Choisir", href: "/devis" },
  }));

  const matrixRows: CompareRow[] = rows.map((r) => ({
    label: r.label,
    values: r.values,
  }));

  return (
    <ComparisonMatrix
      columns={columns}
      rows={matrixRows}
      firstColLabel="Livrables"
    />
  );
}
