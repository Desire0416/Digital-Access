"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Check,
  X,
  ChevronDown,
  CircleHelp,
  RotateCcw,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { cn } from "@da/ui";
import { Schema, Anatomie, Graphique, type SchemaData, type AnatomieData, type GraphiqueData } from "./VisualBlocks";

/* ══════════════════════════════════════════════════════════════════════════
   Blocs interactifs de leçon (§12.2). Ils sont écrits dans le markdown du
   cours sous forme de bloc de code balisé, et rendus ici par de vrais
   composants React — jamais par injection de HTML brut.

       ```da-etapes
       { "titre": "…", "etapes": [ { "titre": "…", "texte": "…" } ] }
       ```

   INVARIANT : un bloc mal formé ne doit JAMAIS casser la leçon d'un apprenant.
   Le dispatcher rattrape toute erreur et retombe sur un rendu neutre.
   ══════════════════════════════════════════════════════════════════════════ */

const CARD = "my-6 overflow-hidden rounded-2xl border border-navy/[0.09] bg-surface-primary not-prose";
const HEAD = "flex items-center gap-2.5 border-b border-navy/[0.07] bg-surface-secondary/60 px-4 py-3 sm:px-5";
const TITLE = "font-display text-sm font-bold text-navy sm:text-base";

/* ─── 1. Étapes : progression pas à pas ─────────────────────────────────── */

interface EtapesData {
  titre?: string;
  etapes: { titre: string; texte: string }[];
}

function Etapes({ data }: { data: EtapesData }) {
  const [open, setOpen] = React.useState(0);
  const reduce = useReducedMotion();
  const n = data.etapes.length;

  return (
    <section className={CARD} aria-label={data.titre || "Étapes"}>
      {data.titre && (
        <div className={HEAD}>
          <ArrowRight size={16} className="shrink-0 text-brand-blue-royal" aria-hidden />
          <h4 className={TITLE}>{data.titre}</h4>
        </div>
      )}
      <ol className="divide-y divide-navy/[0.06]">
        {data.etapes.map((e, i) => {
          const active = open === i;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setOpen(active ? -1 : i)}
                aria-expanded={active}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary/50 sm:px-5"
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                    active ? "bg-gradient-da text-white shadow-brand" : "bg-navy/[0.06] text-navy/70",
                  )}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-navy">{e.titre}</span>
                <ChevronDown
                  size={16}
                  className={cn("shrink-0 text-text-muted transition-transform", active && "rotate-180")}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {active && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 pl-14 text-sm leading-relaxed text-text-secondary sm:px-5 sm:pl-16">
                      {e.texte}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
      <p className="border-t border-navy/[0.06] px-4 py-2 text-[11px] text-text-muted sm:px-5">
        {n} étape{n > 1 ? "s" : ""} — cliquez pour dérouler
      </p>
    </section>
  );
}

/* ─── 2. Quiz éclair : auto-évaluation non notée, correction immédiate ──── */

interface QuizData {
  titre?: string;
  question: string;
  options: string[];
  bonne: number;
  explication?: string;
}

function QuizFlash({ data }: { data: QuizData }) {
  const [choix, setChoix] = React.useState<number | null>(null);
  const reduce = useReducedMotion();
  const repondu = choix !== null;
  const juste = choix === data.bonne;

  return (
    <section className={cn(CARD, "border-brand-blue-vif/25")} aria-label="Question éclair">
      <div className={cn(HEAD, "bg-brand-blue-vif/[0.06]")}>
        <CircleHelp size={16} className="shrink-0 text-brand-blue-royal" aria-hidden />
        <h4 className={TITLE}>{data.titre || "Question éclair"}</h4>
        <span className="ml-auto rounded-full bg-navy/[0.06] px-2 py-0.5 text-[10px] font-semibold text-text-muted">
          non noté
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <p className="mb-3 text-sm font-medium leading-relaxed text-navy">{data.question}</p>
        <div className="space-y-2" role="group">
          {data.options.map((o, i) => {
            const estBonne = i === data.bonne;
            const choisie = choix === i;
            return (
              <button
                key={i}
                type="button"
                disabled={repondu}
                onClick={() => setChoix(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
                  !repondu && "border-navy/[0.1] hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.04]",
                  repondu && estBonne && "border-success/40 bg-success/[0.07] text-navy",
                  repondu && choisie && !estBonne && "border-error/40 bg-error/[0.06] text-navy",
                  repondu && !estBonne && !choisie && "border-navy/[0.08] text-text-muted",
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                    repondu && estBonne
                      ? "border-transparent bg-success text-white"
                      : repondu && choisie
                        ? "border-transparent bg-error text-white"
                        : "border-navy/15 text-navy/60",
                  )}
                  aria-hidden
                >
                  {repondu && estBonne ? <Check size={13} /> : repondu && choisie ? <X size={13} /> : String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0 flex-1">{o}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {repondu && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-3 rounded-xl border px-4 py-3 text-sm",
                juste ? "border-success/30 bg-success/[0.06]" : "border-warning/30 bg-warning/[0.06]",
              )}
            >
              <p className={cn("font-semibold", juste ? "text-success" : "text-[#b45309]")}>
                {juste ? "Bonne réponse " : "Pas tout à fait"}
              </p>
              {data.explication && (
                <p className="mt-1 leading-relaxed text-text-secondary">{data.explication}</p>
              )}
              <button
                type="button"
                onClick={() => setChoix(null)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue-royal hover:text-brand-violet"
              >
                <RotateCcw size={12} aria-hidden />
                Réessayer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── 3. Comparatif : à éviter / à faire ────────────────────────────────── */

interface ComparatifData {
  titre?: string;
  gauche: { titre: string; items: string[] };
  droite: { titre: string; items: string[] };
}

function Comparatif({ data }: { data: ComparatifData }) {
  return (
    <section className={CARD} aria-label={data.titre || "Comparatif"}>
      {data.titre && (
        <div className={HEAD}>
          <Lightbulb size={16} className="shrink-0 text-warning" aria-hidden />
          <h4 className={TITLE}>{data.titre}</h4>
        </div>
      )}
      <div className="grid gap-px bg-navy/[0.07] sm:grid-cols-2">
        {[
          { c: data.gauche, ko: true },
          { c: data.droite, ko: false },
        ].map(({ c, ko }) => (
          <div key={c.titre} className="bg-surface-primary p-4 sm:p-5">
            <p
              className={cn(
                "mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                ko ? "bg-error/10 text-error" : "bg-success/10 text-success",
              )}
            >
              {ko ? <X size={12} aria-hidden /> : <Check size={12} aria-hidden />}
              {c.titre}
            </p>
            <ul className="space-y-2">
              {c.items.map((it, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-text-secondary">
                  <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", ko ? "bg-error/50" : "bg-success/50")} aria-hidden />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── 4. Checklist : cases mémorisées dans le navigateur ────────────────── */

interface ChecklistData {
  titre?: string;
  id?: string;
  items: string[];
}

function Checklist({ data }: { data: ChecklistData }) {
  const key = `da-check-${data.id || (data.titre || "liste").slice(0, 40)}`;
  const [coches, setCoches] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setCoches(new Set(JSON.parse(raw) as number[]));
    } catch {
      /* stockage indisponible : la liste reste utilisable, simplement non mémorisée */
    }
  }, [key]);

  function toggle(i: number) {
    setCoches((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      try {
        localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        /* no-op */
      }
      return next;
    });
  }

  const done = coches.size;
  const pct = data.items.length ? Math.round((done / data.items.length) * 100) : 0;

  return (
    <section className={CARD} aria-label={data.titre || "Checklist"}>
      <div className={HEAD}>
        <Check size={16} className="shrink-0 text-success" aria-hidden />
        <h4 className={TITLE}>{data.titre || "À vérifier"}</h4>
        <span className="ml-auto text-xs font-bold tabular-nums text-text-secondary">
          {done}/{data.items.length}
        </span>
      </div>
      <div className="h-1 bg-navy/[0.06]">
        <div className="h-full bg-gradient-da transition-[width] duration-300" style={{ width: `${pct}%` }} aria-hidden />
      </div>
      <ul className="divide-y divide-navy/[0.05]">
        {data.items.map((it, i) => {
          const on = coches.has(i);
          return (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-secondary/50 sm:px-5">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(i)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-violet"
                />
                <span className={cn("text-sm leading-relaxed", on ? "text-text-muted line-through" : "text-navy")}>{it}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── 5. Onglets : variantes (Windows / Mac, Facebook / Instagram…) ─────── */

interface OngletsData {
  titre?: string;
  onglets: { titre: string; texte: string }[];
}

function Onglets({ data }: { data: OngletsData }) {
  const [actif, setActif] = React.useState(0);
  return (
    <section className={CARD} aria-label={data.titre || "Onglets"}>
      {data.titre && (
        <div className={HEAD}>
          <Lightbulb size={16} className="shrink-0 text-brand-blue-vif" aria-hidden />
          <h4 className={TITLE}>{data.titre}</h4>
        </div>
      )}
      <div className="flex gap-1 overflow-x-auto border-b border-navy/[0.07] bg-surface-secondary/60 px-2 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.onglets.map((o, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActif(i)}
            aria-selected={actif === i}
            role="tab"
            className={cn(
              "shrink-0 rounded-t-lg px-3.5 py-2 text-sm font-semibold transition-colors",
              actif === i ? "bg-surface-primary text-brand-blue-royal" : "text-text-secondary hover:text-navy",
            )}
          >
            {o.titre}
          </button>
        ))}
      </div>
      <p className="p-4 text-sm leading-relaxed text-text-secondary sm:p-5">{data.onglets[actif]?.texte}</p>
    </section>
  );
}

/* ─── Dispatcher ────────────────────────────────────────────────────────── */

/** Rend un bloc interactif. Toute donnée invalide retombe sur un rendu neutre. */
export function LessonBlock({ lang, source }: { lang: string; source: string }) {
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    return null; // bloc illisible : on n'affiche rien plutôt que de casser la leçon
  }
  try {
    const d = data as Record<string, unknown>;
    switch (lang) {
      case "da-etapes":
        return Array.isArray(d.etapes) && d.etapes.length ? <Etapes data={data as EtapesData} /> : null;
      case "da-quiz":
        return typeof d.question === "string" && Array.isArray(d.options) && typeof d.bonne === "number" ? (
          <QuizFlash data={data as QuizData} />
        ) : null;
      case "da-comparatif":
        return d.gauche && d.droite ? <Comparatif data={data as ComparatifData} /> : null;
      case "da-checklist":
        return Array.isArray(d.items) && d.items.length ? <Checklist data={data as ChecklistData} /> : null;
      case "da-onglets":
        return Array.isArray(d.onglets) && d.onglets.length ? <Onglets data={data as OngletsData} /> : null;
      case "da-schema":
        return Array.isArray(d.etapes) && d.etapes.length ? <Schema data={data as SchemaData} /> : null;
      case "da-anatomie":
        return Array.isArray(d.zones) && d.zones.length ? <Anatomie data={data as AnatomieData} /> : null;
      case "da-graphique":
        return Array.isArray(d.barres) && d.barres.length ? <Graphique data={data as GraphiqueData} /> : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}
