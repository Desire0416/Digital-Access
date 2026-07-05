import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  AdminPageHeader,
  StatusPill,
  BLOG_STATUS,
  type Tone,
} from "@/components/admin/ui";
import { getAdminBlogPost } from "@/lib/admin-queries";
import { BlogForm } from "../../BlogForm";
import { DeletePostControl } from "./DeletePostControl";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getAdminBlogPost(id);
  return { title: post ? `Modifier — ${post.title}` : "Article introuvable" };
}

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getAdminBlogPost(id);
  if (!post) notFound();

  const meta = BLOG_STATUS[post.status]!;

  return (
    <>
      <Link
        href="/admin/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au blog
      </Link>

      <AdminPageHeader title="Modifier l’article" description={`/${post.slug}`}>
        <StatusPill label={meta.label} tone={meta.tone as Tone} />
        {post.status === "PUBLISHED" && (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/[0.12] px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/[0.04]"
          >
            <ExternalLink className="h-4 w-4" />
            Voir en ligne
          </Link>
        )}
      </AdminPageHeader>

      <BlogForm mode="edit" post={post} />

      <div className="mt-6">
        <DeletePostControl id={post.id} title={post.title} />
      </div>
    </>
  );
}
