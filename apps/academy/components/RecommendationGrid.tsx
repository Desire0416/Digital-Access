import { StaggerGroup, StaggerItem } from "@da/ui";
import { ArrowUpRight, Rocket, Layers, RefreshCw, FolderKanban, Route, Compass } from "lucide-react";
import { CourseCard, CareerPathCard } from "@/components/cards";
import { RECO_TYPE_LABEL, type Recommendation, type RecoType } from "@/lib/recommendations";

/* ══════════════════════════════════════════════════════════════════════════
   Grille de recommandations personnalisées (cahier §33). Chaque carte porte un
   badge de TYPE (pourquoi c'est recommandé) + une raison en langage naturel,
   au-dessus de la carte formation/parcours réutilisée.
   ══════════════════════════════════════════════════════════════════════════ */

const TYPE_STYLE: Record<RecoType, { badge: string; icon: typeof Rocket }> = {
  NEXT: { badge: "bg-gradient-da text-white", icon: ArrowUpRight },
  SPECIALIZATION: { badge: "bg-brand-violet/10 text-brand-violet", icon: Rocket },
  UPGRADE: { badge: "bg-warning/10 text-[#b45309]", icon: RefreshCw },
  PROJECT: { badge: "bg-brand-blue-vif/10 text-brand-blue-royal", icon: FolderKanban },
  PATH: { badge: "bg-success/10 text-success", icon: Route },
  DISCOVERY: { badge: "bg-navy/[0.06] text-text-secondary", icon: Compass },
};

export function RecommendationGrid({
  recommendations,
  columns = 3,
}: {
  recommendations: Recommendation[];
  columns?: 2 | 3;
}) {
  const grid = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3";
  return (
    <StaggerGroup className={`grid gap-5 ${grid}`}>
      {recommendations.map((r) => {
        const style = TYPE_STYLE[r.type];
        const Icon = style.icon;
        return (
          <StaggerItem key={`${r.kind}-${r.slug}`} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.badge}`}>
                <Icon size={12} aria-hidden />
                {RECO_TYPE_LABEL[r.type]}
              </span>
            </div>
            <p className="text-xs leading-snug text-text-secondary">{r.reason}</p>
            {r.kind === "course" ? (
              <CourseCard
                className="flex-1"
                course={{
                  slug: r.slug,
                  title: r.title,
                  subtitle: r.subtitle,
                  coverImage: r.coverImage,
                  level: r.level,
                  price: r.price,
                  durationHours: r.durationHours,
                  moduleCount: r.moduleCount,
                  rating: r.rating,
                  reviewCount: r.reviewCount,
                  hasCertificate: r.hasCertificate,
                  hasProject: r.hasProject,
                  schoolName: r.schoolName,
                }}
              />
            ) : (
              <CareerPathCard
                className="flex-1"
                path={{
                  slug: r.slug,
                  title: r.title,
                  targetJob: r.targetJob,
                  coverImage: r.coverImage,
                  schoolName: r.schoolName,
                  courseCount: r.courseCount,
                  projectCount: r.projectCount,
                  entryLevel: r.entryLevel,
                  exitLevel: r.exitLevel,
                  price: r.price,
                }}
              />
            )}
          </StaggerItem>
        );
      })}
    </StaggerGroup>
  );
}
