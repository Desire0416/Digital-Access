import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookMarked, Loader2 } from "lucide-react";
import {
  Badge,
  Container,
  GradientText,
  Monogram,
} from "@da/ui";
import { currentUser, hasRole } from "@da/auth/guards";
import { getInstructorDashboard } from "@/lib/studio-queries";
import { getCategories } from "@/lib/queries";
import { NewCourseDialog } from "./NewCourseDialog";
import { StudioStats } from "./StudioStats";
import { StudioCourseRow } from "./StudioCourseRow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio de création",
  robots: { index: false, follow: false },
};

export default async function StudioPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/studio");
  const isAdmin = hasRole(user, "ADMIN", "SUPER_ADMIN");
  if (!hasRole(user, "INSTRUCTOR") && !isAdmin) redirect("/dashboard");

  const [{ stats, courses }, categories] = await Promise.all([
    getInstructorDashboard(user.id),
    getCategories(),
  ]);

  const hasCourses = courses.length > 0;

  return (
    <section className="relative isolate overflow-hidden pb-24 pt-24">
      {/* Décor de fond signature DA */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute -left-24 top-4 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand-cyan/10 blur-[120px]" />
      </div>

      <Container size="lg">
        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-royal">
              <span aria-hidden className="h-px w-7 bg-gradient-da" />
              Studio instructeur
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Studio de <GradientText>création</GradientText>
            </h1>
            <p className="mt-2 max-w-2xl text-text-secondary">
              Concevez vos formations, structurez vos chapitres et suivez leur
              audience. Un cours soumis passe par la validation de l&apos;équipe
              Academy avant sa mise en ligne.
            </p>
          </div>

          <NewCourseDialog categories={categories} />
        </div>

        {/* ── Rangée de statistiques ──────────────────────────────────────── */}
        <div className="mt-10">
          <StudioStats
            cards={[
              {
                key: "published",
                label: "Cours publiés",
                value: stats.published,
                icon: "book-marked",
                tint: "bg-success/10 text-success",
                hint: `${stats.totalCourses} cours au total dans votre studio.`,
              },
              {
                key: "students",
                label: "Apprenants",
                value: stats.totalStudents,
                icon: "users",
                tint: "bg-brand-blue-vif/10 text-brand-blue-royal",
                hint: "Inscrits cumulés sur vos cours publiés.",
              },
              {
                key: "rating",
                label: "Note moyenne",
                value: stats.avgRating,
                decimals: 1,
                suffix: " / 5",
                icon: "star",
                tint: "bg-warning/10 text-warning",
                hint: "Moyenne pondérée de vos cours notés.",
              },
              {
                key: "revenue",
                label: "Revenus",
                value: stats.revenue,
                currency: true,
                icon: "wallet",
                tint: "bg-accent/10 text-accent",
                hint: "Paiements confirmés sur vos cours.",
              },
            ]}
          />

          {/* Pastilles brouillons / en validation */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Badge variant={stats.inReview > 0 ? "warning" : "default"}>
              <Loader2 size={13} className={stats.inReview > 0 ? "animate-spin" : ""} />
              {stats.inReview} en validation
            </Badge>
            <Badge variant="default">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-text-muted" />
              {stats.drafts} brouillon{stats.drafts > 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* ── Mes cours ───────────────────────────────────────────────────── */}
        <div className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-navy">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                <BookMarked size={17} aria-hidden />
              </span>
              Mes cours
              {hasCourses && (
                <Badge variant="soft" className="ml-1">
                  {courses.length}
                </Badge>
              )}
            </h2>
          </div>

          {hasCourses ? (
            <div className="mt-6 grid grid-cols-1 gap-5">
              {courses.map((course) => (
                <StudioCourseRow key={course.id} course={course} />
              ))}
            </div>
          ) : (
            /* État vide brandé */
            <div className="mt-6 flex flex-col items-center overflow-hidden rounded-2xl border border-dashed border-navy/15 bg-surface-primary px-8 py-16 text-center">
              <div className="relative">
                <span
                  aria-hidden
                  className="absolute inset-0 scale-[1.6] rounded-full bg-gradient-da opacity-15 blur-2xl"
                />
                <Monogram size={68} className="relative" />
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold text-navy">
                Créez votre premier cours
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                Partagez votre expertise avec la communauté Access Academy.
                Ajoutez des modules, des vidéos et des quiz — nous nous
                occupons de l&apos;hébergement, des paiements et des
                certificats.
              </p>
              <div className="mt-7">
                <NewCourseDialog categories={categories} />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
