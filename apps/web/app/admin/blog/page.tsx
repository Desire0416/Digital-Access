import Link from "next/link";
import {
  Plus,
  Newspaper,
  Clock,
  User2,
  Tag as TagIcon,
  CalendarDays,
} from "lucide-react";
import { cn, buttonClasses, formatDate } from "@da/ui";
import {
  AdminPageHeader,
  EmptyState,
  StatusPill,
  BLOG_STATUS,
  type Tone,
} from "@/components/admin/ui";
import { getAdminBlogPosts } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog" };

/** Date pertinente : publication si disponible, sinon dernière mise à jour. */
function relevantDate(post: {
  status: string;
  publishedAt: string | null;
  updatedAt: string;
}): { label: string; iso: string } {
  if (post.status === "PUBLISHED" && post.publishedAt) {
    return { label: "Publié le", iso: post.publishedAt };
  }
  return { label: "MAJ le", iso: post.updatedAt };
}

export default async function BlogAdminPage() {
  const posts = await getAdminBlogPosts();

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description="Rédigez, publiez et archivez les articles du blog Digital Access."
      >
        <Link
          href="/admin/blog/nouveau"
          className={buttonClasses({ variant: "primary", size: "md" })}
        >
          <Plus className="h-4 w-4" />
          Nouvel article
        </Link>
      </AdminPageHeader>

      {posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="h-6 w-6" />}
          title="Aucun article pour l’instant"
          description="Publiez votre premier article pour nourrir le blog, améliorer le SEO et partager votre expertise."
        >
          <Link
            href="/admin/blog/nouveau"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            <Plus className="h-4 w-4" />
            Rédiger un article
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* ─────────────── Desktop : tableau ─────────────── */}
          <div className="hidden overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-navy/[0.07] bg-surface-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3">Article</th>
                    <th className="px-5 py-3">Catégorie</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Auteur</th>
                    <th className="px-5 py-3">Lecture</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => {
                    const meta = BLOG_STATUS[post.status]!;
                    const date = relevantDate(post);
                    return (
                      <tr
                        key={post.id}
                        className="group border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-brand-cyan/[0.03]"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="font-display text-sm font-bold text-navy transition-colors group-hover:text-brand-blue-royal"
                          >
                            {post.title}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-text-muted">
                            /{post.slug}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          {post.category ? (
                            <span className="inline-flex items-center gap-1.5 text-text-secondary">
                              <TagIcon className="h-3.5 w-3.5 text-text-muted" />
                              {post.category}
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill label={meta.label} tone={meta.tone as Tone} />
                        </td>
                        <td className="px-5 py-3.5 text-text-secondary">
                          {post.authorName}
                        </td>
                        <td className="px-5 py-3.5 text-text-secondary tabular-nums">
                          {post.readMinutes} min
                        </td>
                        <td className="px-5 py-3.5 text-text-secondary">
                          <span className="block text-[11px] uppercase tracking-wide text-text-muted">
                            {date.label}
                          </span>
                          {formatDate(date.iso)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─────────────── Mobile : cartes empilées ─────────────── */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {posts.map((post) => {
              const meta = BLOG_STATUS[post.status]!;
              const date = relevantDate(post);
              return (
                <Link
                  key={post.id}
                  href={`/admin/blog/${post.id}/edit`}
                  className={cn(
                    "block rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow",
                    "hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold leading-snug text-navy">
                        {post.title}
                      </p>
                      {post.category && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-text-secondary">
                          <TagIcon className="h-3 w-3 text-text-muted" />
                          {post.category}
                        </p>
                      )}
                    </div>
                    <StatusPill label={meta.label} tone={meta.tone as Tone} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-navy/[0.06] pt-3 text-[11px] text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <User2 className="h-3 w-3" />
                      {post.authorName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {date.label} {formatDate(date.iso)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
