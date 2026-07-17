import type { Metadata } from "next";
import Link from "next/link";
import {
  MessagesSquare,
  BookOpen,
  Route as RouteIcon,
  GraduationCap,
  UsersRound,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { StaggerGroup, StaggerItem, cn } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getCommunityHub, type CommunityContextType } from "@/lib/community";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader } from "@/components/espace/parts";

export const metadata: Metadata = { title: "Communauté" };

/* ══════════════════════════════════════════════════════════════════════════
   Hub communautaire (§25) — les espaces de discussion de l'apprenant : ses
   formations, parcours et cohortes. Chaque carte mène à l'espace correspondant.
   ══════════════════════════════════════════════════════════════════════════ */

const TYPE_LABEL: Record<CommunityContextType, string> = {
  course: "Formation",
  careerPath: "Parcours",
  school: "École",
  cohort: "Cohorte",
};
const TYPE_ICON: Record<CommunityContextType, LucideIcon> = {
  course: BookOpen,
  careerPath: RouteIcon,
  school: GraduationCap,
  cohort: UsersRound,
};

export default async function CommunityHubPage() {
  const user = await requireUser("/espace/communaute");
  const spaces = await getCommunityHub(user.id);

  return (
    <div>
      <EspaceHeader
        title="Communauté"
        subtitle="Échangez avec les autres apprenants : posez vos questions, partagez vos projets et entraidez-vous, espace par espace."
      />

      {spaces.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare size={40} className="text-brand-blue-vif/40" />}
          title="Aucun espace communautaire"
          description="Inscrivez-vous à une formation pour rejoindre sa communauté et échanger avec les autres apprenants."
          action={{ label: "Explorer les formations", href: "/formations" }}
        />
      ) : (
        <StaggerGroup className="grid gap-5 sm:grid-cols-2">
          {spaces.map((s) => {
            const Icon = TYPE_ICON[s.type];
            return (
              <StaggerItem key={`${s.type}-${s.id}`}>
                <Link
                  href={s.href}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary transition-all hover:-translate-y-1 hover:border-brand-blue-vif/40 hover:shadow-xl"
                >
                  <span className="h-1 w-full bg-gradient-da" aria-hidden />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-violet/15 to-brand-cyan/15 text-brand-violet"
                        aria-hidden
                      >
                        <Icon size={20} />
                      </span>
                      <span className="inline-flex w-fit items-center rounded-full bg-brand-violet/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-violet">
                        {TYPE_LABEL[s.type]}
                      </span>
                    </div>

                    <h2 className="mt-3.5 font-display text-base font-bold leading-snug text-navy group-hover:text-brand-blue-royal">
                      {s.title}
                    </h2>

                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-secondary">
                      <MessagesSquare size={13} aria-hidden />
                      {s.discussionCount === 0
                        ? "Aucune discussion pour l'instant"
                        : `${s.discussionCount} discussion${s.discussionCount > 1 ? "s" : ""}`}
                    </p>

                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-blue-royal">
                      Ouvrir l'espace
                      <ArrowRight
                        size={14}
                        className={cn("transition-transform group-hover:translate-x-0.5")}
                        aria-hidden
                      />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
