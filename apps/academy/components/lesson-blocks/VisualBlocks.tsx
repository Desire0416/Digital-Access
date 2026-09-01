"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Workflow, LayoutPanelTop, BarChart3 } from "lucide-react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Visuels de leçon — diagrammes SVG générés, interactifs et responsives.
   Choisis plutôt que des images bitmap : nets sur tout écran, quelques
   kilo-octets seulement (décisif en 3G/4G), conformes à la charte, et
   cliquables. Aucune ressource externe n'est chargée.
   ══════════════════════════════════════════════════════════════════════════ */

const CARD = "my-6 overflow-hidden rounded-2xl border border-navy/[0.09] bg-surface-primary not-prose";
const HEAD = "flex items-center gap-2.5 border-b border-navy/[0.07] bg-surface-secondary/60 px-4 py-3 sm:px-5";
const TITLE = "font-display text-sm font-bold text-navy sm:text-base";

/* ─── 1. Schéma de flux : étapes reliées, cliquables ────────────────────── */

export interface SchemaData {
  titre?: string;
  etapes: { label: string; detail?: string }[];
}

export function Schema({ data }: { data: SchemaData }) {
  const [actif, setActif] = React.useState<number | null>(null);
  const reduce = useReducedMotion();
  const n = data.etapes.length;

  return (
    <section className={CARD} aria-label={data.titre || "Schéma"}>
      {data.titre && (
        <div className={HEAD}>
          <Workflow size={16} className="shrink-0 text-brand-blue-royal" aria-hidden />
          <h4 className={TITLE}>{data.titre}</h4>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <ol className="relative">
          {/* Colonne vertébrale dégradée */}
          <span
            className="absolute left-[15px] top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b from-brand-violet via-brand-blue-vif to-brand-cyan"
            aria-hidden
          />
          {data.etapes.map((e, i) => {
            const on = actif === i;
            return (
              <li key={i} className="relative pl-11 pb-3 last:pb-0">
                <button
                  type="button"
                  onClick={() => setActif(on ? null : i)}
                  aria-expanded={e.detail ? on : undefined}
                  className="w-full text-left"
                >
                  <span
                    className={cn(
                      "absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 border-surface-primary text-xs font-bold transition-all",
                      on ? "scale-110 bg-gradient-da text-white shadow-brand" : "bg-navy/[0.07] text-navy/70",
                    )}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "inline-block rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors",
                      on
                        ? "border-brand-blue-vif/40 bg-brand-blue-vif/[0.06] text-navy"
                        : "border-navy/[0.09] text-navy/80 hover:border-brand-blue-vif/30",
                    )}
                  >
                    {e.label}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {on && e.detail && (
                    <motion.p
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.2 }}
                      className="overflow-hidden pt-2 text-sm leading-relaxed text-text-secondary"
                    >
                      {e.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
        {data.etapes.some((e) => e.detail) && (
          <p className="mt-1 text-[11px] text-text-muted">{n} étapes — cliquez sur une étape pour le détail</p>
        )}
      </div>
    </section>
  );
}

/* ─── 2. Anatomie : maquette annotée à zones numérotées ─────────────────── */

export interface AnatomieData {
  titre?: string;
  sujet?: string;
  zones: { nom: string; detail: string; hauteur?: number }[];
}

const ZONE_COULEURS = ["#5B3FA8", "#2B5CC6", "#1E8FE1", "#00BCD4", "#7C3AED", "#0EA5E9"];

export function Anatomie({ data }: { data: AnatomieData }) {
  const [actif, setActif] = React.useState(0);
  const zones = data.zones.slice(0, 6);

  // Hauteurs proportionnelles dans un cadre de 260 unités.
  const poids = zones.map((z) => Math.max(1, z.hauteur ?? 1));
  const somme = poids.reduce((a, b) => a + b, 0);
  const GAP = 4;
  const dispo = 260 - GAP * (zones.length - 1);
  let y = 0;
  const rects = zones.map((z, i) => {
    const h = (poids[i] / somme) * dispo;
    const r = { y, h, z, i };
    y += h + GAP;
    return r;
  });

  return (
    <section className={CARD} aria-label={data.titre || "Anatomie"}>
      {data.titre && (
        <div className={HEAD}>
          <LayoutPanelTop size={16} className="shrink-0 text-brand-violet" aria-hidden />
          <h4 className={TITLE}>{data.titre}</h4>
        </div>
      )}

      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,180px)_1fr] sm:gap-5 sm:p-5">
        {/* Maquette SVG */}
        <svg
          viewBox="0 0 160 260"
          className="h-auto w-full max-w-[180px] justify-self-center"
          role="img"
          aria-label={`Schéma annoté : ${data.sujet || data.titre || "élément"}`}
        >
          {rects.map(({ y: ry, h, z, i }) => {
            const on = actif === i;
            const c = ZONE_COULEURS[i % ZONE_COULEURS.length];
            return (
              <g key={i} onClick={() => setActif(i)} style={{ cursor: "pointer" }}>
                <rect
                  x={2}
                  y={ry}
                  width={156}
                  height={h}
                  rx={6}
                  fill={c}
                  fillOpacity={on ? 0.9 : 0.14}
                  stroke={c}
                  strokeWidth={on ? 2 : 1}
                  strokeOpacity={on ? 1 : 0.35}
                />
                <circle cx={18} cy={ry + h / 2} r={9} fill={on ? "#ffffff" : c} fillOpacity={on ? 1 : 0.85} />
                <text
                  x={18}
                  y={ry + h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight="700"
                  fill={on ? c : "#ffffff"}
                >
                  {i + 1}
                </text>
                {h > 22 && (
                  <text
                    x={34}
                    y={ry + h / 2}
                    dominantBaseline="central"
                    fontSize={9}
                    fontWeight="600"
                    fill={on ? "#ffffff" : "#1A1A2E"}
                    fillOpacity={on ? 1 : 0.75}
                  >
                    {z.nom.length > 20 ? z.nom.slice(0, 19) + "…" : z.nom}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Légende cliquable */}
        <div>
          <ul className="space-y-1.5">
            {zones.map((z, i) => {
              const on = actif === i;
              const c = ZONE_COULEURS[i % ZONE_COULEURS.length];
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setActif(i)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      on ? "bg-navy/[0.05]" : "hover:bg-navy/[0.03]",
                    )}
                  >
                    <span
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: c }}
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-sm font-semibold", on ? "text-navy" : "text-navy/75")}>{z.nom}</span>
                      {on && <span className="mt-0.5 block text-sm leading-relaxed text-text-secondary">{z.detail}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ─── 3. Graphique en barres ────────────────────────────────────────────── */

export interface GraphiqueData {
  titre?: string;
  unite?: string;
  note?: string;
  barres: { label: string; valeur: number }[];
}

const nf = new Intl.NumberFormat("fr-FR");

export function Graphique({ data }: { data: GraphiqueData }) {
  const barres = data.barres.slice(0, 8);
  const max = Math.max(1, ...barres.map((b) => b.valeur));

  return (
    <section className={CARD} aria-label={data.titre || "Graphique"}>
      {data.titre && (
        <div className={HEAD}>
          <BarChart3 size={16} className="shrink-0 text-brand-cyan" aria-hidden />
          <h4 className={TITLE}>{data.titre}</h4>
        </div>
      )}
      <div className="p-4 sm:p-5">
        <ul className="space-y-3">
          {barres.map((b, i) => {
            const pct = Math.round((b.valeur / max) * 100);
            return (
              <li key={i}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium text-navy">{b.label}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-navy">
                    {nf.format(b.valeur)}
                    {data.unite ? <span className="ml-1 text-xs font-medium text-text-muted">{data.unite}</span> : null}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-navy/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-da"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                    role="img"
                    aria-label={`${b.label} : ${b.valeur} ${data.unite ?? ""}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {data.note && <p className="mt-3 text-[11px] leading-relaxed text-text-muted">{data.note}</p>}
      </div>
    </section>
  );
}
