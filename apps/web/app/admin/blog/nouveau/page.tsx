import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { BlogForm } from "../BlogForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouvel article" };

export default function NewBlogPostPage() {
  return (
    <>
      <Link
        href="/admin/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au blog
      </Link>

      <AdminPageHeader
        title="Nouvel article"
        description="Rédigez le contenu en Markdown, réglez les métadonnées, puis créez l’article (en brouillon par défaut)."
      />

      <BlogForm mode="create" />
    </>
  );
}
