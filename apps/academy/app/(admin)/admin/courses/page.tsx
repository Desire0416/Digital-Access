import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Hourglass, LibraryBig, PencilRuler } from "lucide-react";
import { getCategories } from "@/lib/queries";
import { AdminPageHeader, StatCard } from "@/components/admin/ui";
import { getAdminManagedCourses, getInstructors, type AdminManagedCourse } from "./queries";
import { CoursesManager } from "./CoursesManager";
import { CreateCourseDialog } from "./CreateCourseDialog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cours",
  robots: { index: false, follow: false },
};

/** Applique les filtres searchParams à la liste complète (côté serveur). */
function applyFilters(
  courses: AdminManagedCourse[],
  f: { q: string; status: string; category: string; level: string },
): AdminManagedCourse[] {
  const q = f.q.trim().toLowerCase();
  return courses.filter((c) => {
    if (f.status && c.status !== f.status) return false;
    if (f.category && c.categorySlug !== f.category) return false;
    if (f.level && c.level !== f.level) return false;
    if (q) {
      const hay = `${c.title} ${c.instructor.name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/* Enveloppe une StatCard dans un lien de filtre (?status=… ou reset). */
function KpiLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={
        active
          ? "block rounded-2xl outline-none ring-2 ring-brand-blue-vif/50 transition"
          : "block rounded-2xl outline-none ring-2 ring-transparent transition hover:ring-brand-blue-vif/25 focus-visible:ring-brand-blue-vif/50"
      }
    >
      {children}
    </Link>
  );
}

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    level?: string;
  }>;
}) {
  const sp = await searchParams;
  const filters = {
    q: sp.q ?? "",
    status: sp.status ?? "",
    category: sp.category ?? "",
    level: sp.level ?? "",
  };

  const [{ courses, counts }, categories, instructors] = await Promise.all([
    getAdminManagedCourses(),
    getCategories(),
    getInstructors(),
  ]);

  const filtered = applyFilters(courses, filters);
  const categoryOptions = categories.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div>
      <AdminPageHeader
        title="Cours"
        description="Gérez l'intégralité du catalogue Academy : créez un cours, éditez-le, validez les soumissions des instructeurs, publiez ou dépubliez, dupliquez ou supprimez. Les cours en attente de validation sont mis en avant."
      >
        <CreateCourseDialog categories={categories} />
      </AdminPageHeader>

      {/* ── KPI cliquables (filtre via l'URL) ────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiLink href="/admin/courses" active={!filters.status}>
          <StatCard
            icon={<LibraryBig size={18} />}
            label="Cours au total"
            value={counts.total}
            tone="violet"
            hint="Voir tout"
          />
        </KpiLink>
        <KpiLink href="/admin/courses?status=PUBLISHED" active={filters.status === "PUBLISHED"}>
          <StatCard
            icon={<CircleCheck size={18} />}
            label="Publiés"
            value={counts.published}
            tone="green"
            hint="Filtrer"
          />
        </KpiLink>
        <KpiLink href="/admin/courses?status=REVIEW" active={filters.status === "REVIEW"}>
          <StatCard
            icon={<Hourglass size={18} />}
            label="En validation"
            value={counts.review}
            tone="amber"
            hint="Filtrer"
          />
        </KpiLink>
        <KpiLink href="/admin/courses?status=DRAFT" active={filters.status === "DRAFT"}>
          <StatCard
            icon={<PencilRuler size={18} />}
            label="Brouillons"
            value={counts.draft}
            tone="slate"
            hint="Filtrer"
          />
        </KpiLink>
      </div>

      {/* ── Recherche + filtres + grille ─────────────────────────────────── */}
      <CoursesManager
        courses={filtered}
        categories={categoryOptions}
        instructors={instructors}
        filters={filters}
      />
    </div>
  );
}
