import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUser, hasRole } from "@da/auth/guards";
import { getCourseForEdit } from "@/lib/studio-queries";
import { getCategories } from "@/lib/queries";
import { CourseEditor } from "./CourseEditor";

export const dynamic = "force-dynamic";

/* ─────────────────────────────── Métadonnées ───────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await currentUser();
  if (!user) {
    return { title: "Éditeur de cours", robots: { index: false, follow: false } };
  }
  const isAdmin = hasRole(user, "ADMIN", "SUPER_ADMIN");
  const course = await getCourseForEdit(user.id, id, isAdmin);
  return {
    title: course ? `Édition — ${course.title}` : "Éditeur de cours",
    robots: { index: false, follow: false },
  };
}

/* ─────────────────────────────────── Page ──────────────────────────────────── */

export default async function CourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) {
    redirect(`/auth/login?callbackUrl=/studio/courses/${id}/edit`);
  }

  const isAdmin = hasRole(user, "ADMIN", "SUPER_ADMIN");
  const isInstructor = hasRole(user, "INSTRUCTOR") || isAdmin;
  if (!isInstructor) redirect("/dashboard");

  const [course, categories] = await Promise.all([
    getCourseForEdit(user.id, id, isAdmin),
    getCategories(),
  ]);

  if (!course) notFound();

  return <CourseEditor course={course} categories={categories} />;
}
