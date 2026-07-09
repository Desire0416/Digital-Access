"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, FolderKanban, Star, Sparkles } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   Composition visuelle du hero — le parcours « apprendre → prouver → certifier »
   évoqué par des cartes flottantes et le dégradé signature. Purement décoratif
   (aria-hidden). Animations douces, désactivées si prefers-reduced-motion.
   ══════════════════════════════════════════════════════════════════════════ */

export function HeroVisual() {
  const reduce = useReducedMotion();
  const float = (dy: number, d: number) =>
    reduce ? {} : { animate: { y: [0, dy, 0] }, transition: { duration: d, repeat: Infinity, ease: "easeInOut" } };

  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[30rem]">
      {/* Halos dégradés */}
      <div className="absolute -right-8 top-4 h-72 w-72 rounded-full bg-gradient-da opacity-25 blur-3xl" />
      <div className="absolute -left-6 bottom-6 h-56 w-56 rounded-full bg-brand-violet/20 blur-3xl" />

      {/* Anneau pointillé en rotation lente */}
      <motion.div
        className="absolute inset-6 rounded-[2.5rem] border-2 border-dashed border-brand-blue-vif/20"
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Carte parcours (principale) */}
      <motion.div
        {...float(-10, 6)}
        className="absolute left-1/2 top-1/2 w-60 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-navy/[0.06] bg-surface-primary shadow-2xl"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-da">
          <div className="absolute inset-0 bg-grid opacity-25" />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-navy">École d'IA</span>
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-white/80">Assistant IA Professionnel</p>
            <p className="font-display text-sm font-bold leading-tight text-white">Devenez expert de l'IA</p>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-text-muted">
            <span>Progression</span>
            <span className="text-navy">68%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-navy/[0.08]">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan" />
          </div>
        </div>
      </motion.div>

      {/* Carte certificat (haut-droite) */}
      <motion.div
        {...float(-14, 7)}
        className="absolute right-0 top-6 flex items-center gap-2.5 rounded-xl border border-success/20 bg-surface-primary p-3 shadow-xl"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/10 text-success">
          <BadgeCheck size={18} />
        </span>
        <div>
          <p className="text-[11px] font-bold text-navy">Certificat vérifié</p>
          <p className="font-mono text-[9px] text-text-muted">DA-2026-A7F3</p>
        </div>
      </motion.div>

      {/* Médaillon badge (bas-gauche) */}
      <motion.div
        {...float(12, 5.5)}
        className="absolute -left-1 bottom-8 flex items-center gap-2.5 rounded-xl border border-accent/20 bg-surface-primary p-3 shadow-xl"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-accent to-brand-violet text-white">
          <Star size={16} />
        </span>
        <div>
          <p className="text-[11px] font-bold text-navy">Badge par preuve</p>
          <p className="text-[9px] text-text-muted">Projet validé</p>
        </div>
      </motion.div>

      {/* Puce projet (bas-droite) */}
      <motion.div
        {...float(-9, 6.5)}
        className="absolute bottom-2 right-8 flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-surface-primary px-3 py-1.5 shadow-lg"
      >
        <FolderKanban size={13} className="text-brand-blue-royal" />
        <span className="text-[11px] font-semibold text-navy">Portfolio</span>
      </motion.div>

      {/* Étincelle */}
      <motion.div
        className="absolute right-16 top-0 text-brand-cyan"
        animate={reduce ? {} : { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles size={22} />
      </motion.div>
    </div>
  );
}
