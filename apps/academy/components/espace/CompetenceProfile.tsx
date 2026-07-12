import Link from "next/link";
import { Award, ShieldCheck, Sparkles, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { StaggerGroup, StaggerItem, cn } from "@da/ui";
import type { LearnerCompetences, CompetenceCard, SkillLevelName } from "@/lib/skill-queries";
import { EmptyState } from "@/components/EmptyState";
import { StatTile } from "@/components/espace/parts";

/* ══════════════════════════════════════════════════════════════════════════
   Passeport de compétences (§21.4) — affichage read-only, dérivé des
   formations validées de l'apprenant. Composant serveur/présentationnel :
   pas de "use client", pas d'état ; l'animation vient de StaggerGroup (@da/ui).
   ══════════════════════════════════════════════════════════════════════════ */

/** Intensité de marque par niveau : DISCOVERY estompé → EXPERT dégradé plein. */
const LEVEL_BADGE: Record<SkillLevelName, string> = {
  DISCOVERY: "bg-navy/[0.06] text-navy/60",
  BEGINNER: "bg-brand-cyan/10 text-brand-blue-vif",
  OPERATIONAL: "bg-brand-blue-royal/10 text-brand-blue-royal",
  ADVANCED: "bg-brand-violet/10 text-brand-violet",
  EXPERT: "bg-gradient-da text-white shadow-brand",
};

function LevelBadge({ level, label, aimed = false }: { level: SkillLevelName; label: string; aimed?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        LEVEL_BADGE[level],
      )}
    >
      {aimed ? `${label} · visé` : label}
    </span>
  );
}

function SkillCard({ card, aimed = false }: { card: CompetenceCard; aimed?: boolean }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-lg sm:p-5">
      {/* Nom + certification */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="min-w-0 break-words font-display text-sm font-bold leading-snug text-navy sm:text-base">
          {card.name}
        </h4>
        {card.certified && !aimed && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-success">
            <ShieldCheck size={11} aria-hidden />
            Certifiée
          </span>
        )}
      </div>

      {/* Niveau */}
      <div className="mt-2.5">
        <LevelBadge level={card.level} label={card.levelLabel} aimed={aimed} />
      </div>

      {/* Preuves : formations d'origine */}
      <div className="mt-4 border-t border-navy/[0.05] pt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Preuves</p>
        <ul className="space-y-1.5">
          {card.sources.map((s, i) => (
            <li key={`${s.courseSlug}-${i}`} className="min-w-0">
              <Link
                href={`/formations/${s.courseSlug}`}
                className="flex items-start gap-1.5 text-xs text-navy/80 transition-colors hover:text-brand-violet"
              >
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {s.completed ? (
                    <CheckCircle2 size={13} className="text-success" />
                  ) : (
                    <Circle size={13} className="text-text-muted" />
                  )}
                </span>
                <span className="min-w-0 break-words font-medium">
                  {s.courseTitle}
                  <span className="ml-1 text-[11px] font-normal text-text-muted">
                    · {s.completed ? "terminée" : "en cours"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function CompetenceProfile({ data }: { data: LearnerCompetences }) {
  const isEmpty = data.totalAcquired === 0 && data.totalInProgress === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Award size={40} className="text-brand-violet/40" />}
        title="Vous n'avez pas encore de compétences validées."
        description="Suivez et terminez une formation pour bâtir votre passeport de compétences, prêt à présenter à un employeur."
        action={{ label: "Explorer les formations", href: "/formations" }}
      />
    );
  }

  return (
    <div className="space-y-9">
      {/* Statistiques — passeport en un coup d'œil */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          icon={<Sparkles size={18} />}
          value={data.totalAcquired}
          label="Compétences acquises"
          accent="text-brand-violet"
        />
        <StatTile
          icon={<ShieldCheck size={18} />}
          value={data.totalCertified}
          label="Certifiées"
          accent="text-success"
        />
        <StatTile
          icon={<TrendingUp size={18} />}
          value={data.totalInProgress}
          label="En cours d'acquisition"
          accent="text-brand-blue-royal"
        />
      </div>

      {/* Compétences acquises, groupées par domaine */}
      {data.groups.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display text-lg font-bold text-navy sm:text-xl">Compétences acquises</h2>
          {data.groups.map((group) => (
            <div key={group.domain}>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-4 w-1 shrink-0 rounded-full bg-gradient-da" aria-hidden />
                <h3 className="min-w-0 break-words font-display text-sm font-bold uppercase tracking-wide text-navy/70">
                  {group.domain}
                </h3>
                <span className="shrink-0 text-xs text-text-muted">({group.skills.length})</span>
              </div>
              <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.skills.map((card) => (
                  <StaggerItem key={card.id}>
                    <SkillCard card={card} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          ))}
        </section>
      )}

      {/* Compétences en cours d'acquisition */}
      {data.inProgress.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy sm:text-xl">En cours d'acquisition</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Issues de vos formations en cours — validées dès leur achèvement.
            </p>
          </div>
          <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.inProgress.map((card) => (
              <StaggerItem key={card.id}>
                <SkillCard card={card} aimed />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      )}
    </div>
  );
}
