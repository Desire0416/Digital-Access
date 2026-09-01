"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Shapes } from "lucide-react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Figures illustrées et INTERACTIVES (bloc `da-figure`).

   Une image .svg servie par <img> ne serait pas cliquable : les figures sont
   donc dessinées ici en SVG inline, avec des zones sélectionnables qui
   déplient une explication. Quatre gabarits couvrent l'essentiel des besoins
   pédagogiques : tunnel, cycle, matrice, pyramide.

   Contrainte de dessin : les libellés longs sont tronqués DANS la figure et
   toujours donnés en entier dans la légende — sans quoi le texte déborde du
   cadre (défaut constaté sur une première illustration).
   ══════════════════════════════════════════════════════════════════════════ */

const CARD = "my-6 overflow-hidden rounded-2xl border border-navy/[0.09] bg-surface-primary not-prose";
const HEAD = "flex items-center gap-2.5 border-b border-navy/[0.07] bg-surface-secondary/60 px-4 py-3 sm:px-5";
const TITLE = "font-display text-sm font-bold text-navy sm:text-base";

const COULEURS = ["#5B3FA8", "#2B5CC6", "#1E8FE1", "#0EA5E9", "#00BCD4", "#7C3AED"];
const couleur = (i: number) => COULEURS[i % COULEURS.length];
const court = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export interface FigureItem {
  label: string;
  valeur?: string;
  detail?: string;
}
export interface FigureData {
  type?: "tunnel" | "cycle" | "matrice" | "pyramide";
  titre?: string;
  note?: string;
  axeX?: string;
  axeY?: string;
  items: FigureItem[];
}

/* ─── Gabarit 1 : tunnel (entonnoir de conversion) ──────────────────────── */
function Tunnel({ items, actif, onPick }: { items: FigureItem[]; actif: number; onPick: (i: number) => void }) {
  const n = items.length;
  const H = 46, GAP = 8;
  const hauteur = n * H + (n - 1) * GAP;
  /* Colonne de valeurs RÉSERVÉE à droite : les barres vivent dans 0..330,
     les valeurs commencent à 342. Sans cette réserve, la valeur de la barre
     la plus large sortait du cadre. */
  const CENTRE = 168, MAX = 296, COL_VAL = 342, W = 470;
  return (
    <svg viewBox={`0 0 ${W} ${hauteur}`} className="h-auto w-full" role="img" aria-label="Entonnoir de conversion">
      {items.map((it, i) => {
        const large = MAX - (i * (MAX - 110)) / Math.max(1, n - 1);
        const x = CENTRE - large / 2;
        const y = i * (H + GAP);
        const on = actif === i;
        return (
          <g key={i} onClick={() => onPick(i)} style={{ cursor: "pointer" }}>
            <rect x={x} y={y} width={large} height={H} rx={8} fill={couleur(i)} fillOpacity={on ? 1 : 0.78}
              stroke={couleur(i)} strokeWidth={on ? 2.5 : 0} />
            <text x={CENTRE} y={y + H / 2} textAnchor="middle" dominantBaseline="central"
              fontSize={12} fontWeight="700" fill="#fff">{court(it.label, Math.floor(large / 8))}</text>
            {it.valeur && (
              <text x={COL_VAL} y={y + H / 2} dominantBaseline="central"
                fontSize={11} fontWeight="600" fill="#1A1A2E">{court(it.valeur, 16)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Gabarit 2 : cycle (processus circulaire) ──────────────────────────── */
function Cycle({ items, actif, onPick }: { items: FigureItem[]; actif: number; onPick: (i: number) => void }) {
  const n = items.length;
  const R = 92, C = 130;
  return (
    <svg viewBox="0 0 260 260" className="mx-auto h-auto w-full max-w-[260px]" role="img" aria-label="Cycle">
      <circle cx={C} cy={C} r={R} fill="none" stroke="#E5E7EB" strokeWidth={2} strokeDasharray="4 5" />
      {items.map((it, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        const x = C + R * Math.cos(a), y = C + R * Math.sin(a);
        const on = actif === i;
        return (
          <g key={i} onClick={() => onPick(i)} style={{ cursor: "pointer" }}>
            <circle cx={x} cy={y} r={on ? 26 : 22} fill={couleur(i)} fillOpacity={on ? 1 : 0.85} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="700" fill="#fff">
              {i + 1}
            </text>
          </g>
        );
      })}
      <text x={C} y={C - 6} textAnchor="middle" fontSize={11} fontWeight="600" fill="#6B7280">Cycle</text>
      <text x={C} y={C + 10} textAnchor="middle" fontSize={11} fontWeight="700" fill="#1A1A2E">{n} étapes</text>
    </svg>
  );
}

/* ─── Gabarit 3 : matrice 2×2 ───────────────────────────────────────────── */
function Matrice({ items, actif, onPick, axeX, axeY }: { items: FigureItem[]; actif: number; onPick: (i: number) => void; axeX?: string; axeY?: string }) {
  const q = items.slice(0, 4);
  const pos = [{ x: 40, y: 14 }, { x: 208, y: 14 }, { x: 40, y: 132 }, { x: 208, y: 132 }];
  return (
    <svg viewBox="0 0 390 290" className="h-auto w-full" role="img" aria-label="Matrice à quatre quadrants">
      {q.map((it, i) => {
        const on = actif === i;
        return (
          <g key={i} onClick={() => onPick(i)} style={{ cursor: "pointer" }}>
            <rect x={pos[i].x} y={pos[i].y} width={160} height={110} rx={10}
              fill={couleur(i)} fillOpacity={on ? 0.92 : 0.14} stroke={couleur(i)} strokeWidth={on ? 2.5 : 1.2} />
            <text x={pos[i].x + 80} y={pos[i].y + 55} textAnchor="middle" dominantBaseline="central"
              fontSize={12} fontWeight="700" fill={on ? "#fff" : "#1A1A2E"}>{court(it.label, 20)}</text>
          </g>
        );
      })}
      {axeY && <text x={14} y={130} fontSize={10} fontWeight="600" fill="#6B7280" transform="rotate(-90 14 130)" textAnchor="middle">{court(axeY, 30)}</text>}
      {axeX && <text x={195} y={276} fontSize={10} fontWeight="600" fill="#6B7280" textAnchor="middle">{court(axeX, 44)}</text>}
    </svg>
  );
}

/* ─── Gabarit 4 : pyramide (hiérarchie) ─────────────────────────────────── */
function Pyramide({ items, actif, onPick }: { items: FigureItem[]; actif: number; onPick: (i: number) => void }) {
  const n = items.length;
  const H = 44, GAP = 6;
  const hauteur = n * H + (n - 1) * GAP;
  return (
    <svg viewBox={`0 0 400 ${hauteur}`} className="h-auto w-full" role="img" aria-label="Pyramide">
      {items.map((it, i) => {
        const large = 120 + (i * 220) / Math.max(1, n - 1);
        const x = (400 - large) / 2;
        const y = i * (H + GAP);
        const on = actif === i;
        return (
          <g key={i} onClick={() => onPick(i)} style={{ cursor: "pointer" }}>
            <rect x={x} y={y} width={large} height={H} rx={7} fill={couleur(i)} fillOpacity={on ? 1 : 0.8}
              stroke={couleur(i)} strokeWidth={on ? 2.5 : 0} />
            <text x={200} y={y + H / 2} textAnchor="middle" dominantBaseline="central"
              fontSize={12} fontWeight="700" fill="#fff">{court(it.label, Math.floor(large / 8))}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Bloc ──────────────────────────────────────────────────────────────── */

export function Figure({ data }: { data: FigureData }) {
  const [actif, setActif] = React.useState(0);
  const reduce = useReducedMotion();
  const items = (data.items || []).slice(0, 6);
  if (!items.length) return null;
  const type = data.type ?? "tunnel";
  const sel = items[actif];

  const dessin =
    type === "cycle" ? <Cycle items={items} actif={actif} onPick={setActif} />
    : type === "matrice" ? <Matrice items={items} actif={actif} onPick={setActif} axeX={data.axeX} axeY={data.axeY} />
    : type === "pyramide" ? <Pyramide items={items} actif={actif} onPick={setActif} />
    : <Tunnel items={items} actif={actif} onPick={setActif} />;

  return (
    <section className={CARD} aria-label={data.titre || "Figure"}>
      {data.titre && (
        <div className={HEAD}>
          <Shapes size={16} className="shrink-0 text-brand-violet" aria-hidden />
          <h4 className={TITLE}>{data.titre}</h4>
        </div>
      )}
      <div className="p-4 sm:p-5">
        {dessin}

        {/* Légende : libellés complets, jamais tronqués. */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActif(i)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                actif === i ? "border-transparent text-white" : "border-navy/10 text-navy/70 hover:border-navy/25",
              )}
              style={actif === i ? { backgroundColor: couleur(i) } : undefined}
            >
              <span className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold"
                style={{ backgroundColor: actif === i ? "rgba(255,255,255,.25)" : couleur(i), color: "#fff" }} aria-hidden>
                {i + 1}
              </span>
              {it.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {sel?.detail && (
            <motion.p
              key={actif}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
              className="mt-3 rounded-xl bg-surface-secondary/70 px-4 py-3 text-sm leading-relaxed text-text-secondary"
            >
              <strong className="text-navy">{sel.label}{sel.valeur ? ` — ${sel.valeur}` : ""} : </strong>
              {sel.detail}
            </motion.p>
          )}
        </AnimatePresence>

        {data.note && <p className="mt-2 text-[11px] leading-relaxed text-text-muted">{data.note}</p>}
      </div>
    </section>
  );
}
