"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Graphes sur-mesure Digital Access (aucune lib générique).
   Dégradé signature violet→cyan, animations Framer Motion, responsives.
   NB : ces composants sont "use client" — on ne leur passe donc jamais de
   fonction depuis un Server Component (non sérialisable). Le format est piloté
   par une chaîne (`format`).
   ══════════════════════════════════════════════════════════════════════════ */

type ChartFormat = "plain" | "fcfa";

const fcfaFmt = new Intl.NumberFormat("fr-CI", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

function formatChartValue(v: number, format: ChartFormat): string {
  return format === "fcfa" ? fcfaFmt.format(v) : String(v);
}

/** Histogramme vertical — ex. revenus encaissés par mois. */
export function BarChart({
  data,
  format = "plain",
  className,
}: {
  data: { label: string; value: number }[];
  format?: ChartFormat;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const topLabelFor = (v: number) => (v > 0 ? formatChartValue(v, format) : "");

  return (
    <div className={cn("flex items-end gap-2 sm:gap-3", className)} style={{ height: 200 }}>
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[10px] font-semibold tabular-nums text-text-secondary sm:text-xs">
              {topLabelFor(d.value)}
            </span>
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${Math.max(pct, d.value > 0 ? 4 : 0.5)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "w-full max-w-[46px] rounded-t-lg",
                d.value > 0 ? "bg-gradient-to-t from-brand-violet to-brand-cyan" : "bg-navy/[0.06]",
              )}
              style={{ minHeight: 2 }}
            />
            <span className="w-full truncate text-center text-[11px] font-medium text-text-muted">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Barres horizontales (entonnoir) — ex. leads par statut. */
export function FunnelBars({
  data,
  format = "plain",
  className,
}: {
  data: { label: string; value: number; tint?: string }[];
  format?: ChartFormat;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-text-secondary">{d.label}</span>
              <span className="font-bold tabular-nums text-navy">{formatChartValue(d.value, format)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-navy/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${d.value > 0 ? Math.max(pct, 3) : 0}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: d.tint ?? "linear-gradient(90deg,#5b3fa8,#00bcd4)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Anneau de répartition (conic-gradient) — ex. projets par statut. */
export function DonutChart({
  data,
  centerLabel,
  centervalue,
  className,
}: {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centervalue?: string;
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const stops: string[] = [];
  if (total > 0) {
    for (const d of data) {
      const start = (acc / total) * 360;
      acc += d.value;
      const end = (acc / total) * 360;
      stops.push(`${d.color} ${start}deg ${end}deg`);
    }
  } else {
    stops.push("rgba(26,26,46,0.06) 0deg 360deg");
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0, rotate: -12 }}
        whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid h-40 w-40 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${stops.join(",")})` }}
      >
        <div className="grid h-[62%] w-[62%] place-items-center rounded-full bg-surface-primary text-center">
          <div>
            <p className="font-display text-2xl font-extrabold text-navy">
              {centervalue ?? total}
            </p>
            {centerLabel && (
              <p className="text-[11px] font-medium text-text-muted">{centerLabel}</p>
            )}
          </div>
        </div>
      </motion.div>

      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-text-secondary">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="font-bold tabular-nums text-navy">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
