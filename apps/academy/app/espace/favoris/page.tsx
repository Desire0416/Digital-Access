import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { getFavorites } from "@/lib/learn-queries";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader } from "@/components/espace/parts";
import { FavoritesGrid, type FavoriteEntry } from "./FavoritesGrid";

export const metadata: Metadata = { title: "Mes favoris" };

export default async function FavoritesPage() {
  const user = await requireUser("/espace/favoris");
  const favorites = await getFavorites(user.id);

  const entries: FavoriteEntry[] = favorites.map((f) => {
    if (f.course) {
      return {
        id: f.id,
        kind: "course",
        courseId: f.course.id,
        course: {
          slug: f.course.slug,
          title: f.course.title,
          subtitle: f.course.subtitle,
          coverImage: f.course.coverImage,
          level: f.course.level,
          price: f.course.price,
          durationHours: f.course.durationHours,
          moduleCount: f.course._count.modules,
        },
      };
    }
    return {
      id: f.id,
      kind: "path",
      careerPathId: f.careerPath!.id,
      path: {
        slug: f.careerPath!.slug,
        title: f.careerPath!.title,
        targetJob: f.careerPath!.targetJob,
        coverImage: f.careerPath!.coverImage,
        courseCount: f.careerPath!._count.courses,
        projectCount: f.careerPath!._count.projects,
        entryLevel: f.careerPath!.entryLevel,
        exitLevel: f.careerPath!.exitLevel,
        price: f.careerPath!.price,
      },
    };
  });

  return (
    <div>
      <EspaceHeader
        title="Mes favoris"
        subtitle="Les formations et parcours que vous avez mis de côté pour plus tard."
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={<Heart size={40} className="text-error/30" />}
          title="Aucun favori"
          description="Cliquez sur le cœur d'une formation ou d'un parcours pour le retrouver ici."
          action={{ label: "Parcourir le catalogue", href: "/formations" }}
        />
      ) : (
        <FavoritesGrid initial={entries} />
      )}
    </div>
  );
}
