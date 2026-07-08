import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap, CheckCircle2, Medal, ScrollText, PlayCircle, ArrowRight,
  Fingerprint, FolderKanban, Briefcase, MailWarning, Sparkles,
} from "lucide-react";
import { GradientText } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getLearnerDashboard } from "@/lib/learn-queries";
import { DashboardHeading, StatTile, CourseProgressCard, EmptyState } from "@/components/learner-ui";
import { BADGE_CATEGORY_LABEL } from "@/lib/learn-labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/dashboard");
  const data = await getLearnerDashboard(user.id);
  if (!data) redirect("/auth/login?callbackUrl=/dashboard");

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeading
        eyebrow="Tableau de bord"
        title={<>Bonjour {data.name.split(" ")[0]} <GradientText>👋</GradientText></>}
        description="Reprenez votre apprentissage, suivez vos progrès et construisez votre profil professionnel."
      />

      {!data.emailVerified && (
        <div className="flex flex-col gap-2 rounded-2xl border border-warning/30 bg-warning/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-navy">
            <MailWarning size={18} className="text-warning" />
            Confirmez votre email pour débloquer l'inscription aux parcours et les certificats.
          </p>
          <Link href="/auth/verify-email" className="shrink-0 text-sm font-semibold text-brand-blue-royal underline">
            Renvoyer l'email
          </Link>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<GraduationCap size={18} />} label="Parcours suivis" value={data.stats.enrolled} />
        <StatTile icon={<CheckCircle2 size={18} />} label="Leçons terminées" value={data.stats.lessonsCompleted} accent="from-brand-blue-royal to-brand-blue-vif" />
        <StatTile icon={<Medal size={18} />} label="Badges obtenus" value={data.stats.badges} accent="from-accent to-brand-violet" />
        <StatTile icon={<ScrollText size={18} />} label="Certificats" value={data.stats.certificates} accent="from-brand-blue-vif to-brand-cyan" />
      </div>

      {/* Reprendre */}
      {data.nextUp && (
        <div className="relative isolate overflow-hidden rounded-3xl bg-navy p-6 text-white sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-da opacity-30 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-cyan">Reprendre où vous en étiez</p>
              <h2 className="mt-1.5 font-display text-xl font-extrabold sm:text-2xl">{data.nextUp.lessonTitle}</h2>
              <p className="mt-1 text-sm text-white/70">{data.nextUp.courseTitle}</p>
            </div>
            <Link
              href={`/apprendre/${data.nextUp.slug}/${data.nextUp.lessonId}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-navy transition-transform hover:scale-[1.03]"
            >
              <PlayCircle size={18} /> Continuer
            </Link>
          </div>
        </div>
      )}

      {/* Cours en cours */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy">Mes cours en cours</h2>
          <Link href="/dashboard/mes-cours" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet">
            Tout voir <ArrowRight size={15} />
          </Link>
        </div>
        {data.inProgress.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.inProgress.slice(0, 3).map((c) => <CourseProgressCard key={c.enrollmentId} card={c} />)}
          </div>
        ) : (
          <EmptyState
            icon={<Sparkles size={22} />}
            title="Commencez votre premier parcours"
            message="Explorez nos parcours métiers et lancez-vous — chaque leçon vous rapproche d'un métier du numérique."
            action={{ href: "/career-paths", label: "Explorer les parcours" }}
          />
        )}
      </section>

      {/* Badges récents */}
      {data.recentBadges.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-navy">Badges récents</h2>
            <Link href="/dashboard/badges" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet">
              Tout voir <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.recentBadges.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/[0.04] px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-accent to-brand-violet text-white shadow-brand">
                  <Medal size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">{b.name}</p>
                  <p className="text-[11px] text-text-muted">{BADGE_CATEGORY_LABEL[b.category] ?? b.category}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Raccourcis employabilité */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/dashboard/passeport", icon: Fingerprint, title: "Passeport de compétences", desc: "Vos compétences acquises et validées" },
          { href: "/dashboard/portfolio", icon: FolderKanban, title: "Portfolio", desc: "Vos projets professionnels" },
          { href: "/dashboard/opportunites", icon: Briefcase, title: "Opportunités", desc: "Offres alignées à votre profil" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group flex items-start gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand"><Icon size={18} /></span>
              <div>
                <p className="font-display text-sm font-bold text-navy">{s.title}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{s.desc}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal group-hover:text-brand-violet">Ouvrir <ArrowRight size={12} /></span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
