import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Users, Star, Layers, GraduationCap } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getInstructorCourses } from "@/lib/instructor-queries";
import { LEVEL_LABEL } from "@/lib/site";
import { EspaceHeader } from "@/components/espace/parts";
import { StatusPill, CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE } from "@/components/admin/ui";
import { EmptyState } from "@/components/EmptyState";
import { CreateCourseButton } from "./CreateCourseButton";

export const metadata: Metadata = { title: "Mes formations — Studio formateur" };

export default async function FormateurFormationsPage() {
  const user = await requireRole(["INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], "/formateur/formations");
  const courses = await getInstructorCourses(user);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <EspaceHeader
          title="Mes formations"
          subtitle="Composez le programme de chaque formation, puis soumettez-la à validation. Une formation validée est publiée par l'équipe pédagogique."
        />
        <div className="shrink-0">
          <CreateCourseButton />
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} className="text-brand-blue-royal/40" />}
          title="Vous n'encadrez aucune formation"
          description="Créez votre première formation pour composer son programme et la soumettre à validation."
        />
      ) : (
        <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <StaggerItem key={c.id}>
              <Link
                href={`/formateur/formations/${c.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[16/7] overflow-hidden">
                  {c.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="relative h-full w-full"
                      style={{ background: "linear-gradient(125deg,#5b3fa8,#2b5cc6 45%,#1e8fe1 72%,#00bcd4)" }}
                      aria-hidden
                    >
                      <span className="absolute inset-0 bg-grid opacity-30" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <StatusPill label={CONTENT_STATUS_LABEL[c.status]} tone={CONTENT_STATUS_TONE[c.status]} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-base font-bold leading-snug text-navy group-hover:text-brand-blue-royal">
                    {c.title}
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Layers size={13} aria-hidden />
                      {LEVEL_LABEL[c.level] ?? c.level}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={13} aria-hidden />
                      {c.learnerCount} inscrit{c.learnerCount > 1 ? "s" : ""}
                    </span>
                    {c.avgRating != null && (
                      <span className="inline-flex items-center gap-1">
                        <Star size={13} className="text-warning" aria-hidden />
                        {c.avgRating.toFixed(1)}
                        <span className="text-text-muted">({c.reviewCount})</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-text-muted">
                    <GraduationCap size={13} aria-hidden />
                    {c.moduleCount} module{c.moduleCount > 1 ? "s" : ""} · {c.lessonCount} leçon
                    {c.lessonCount > 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
