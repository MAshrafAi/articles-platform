import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ArticleWorkspace } from "@/components/articles/article-workspace";
import type { ArticleFull } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await requireUser();

  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select(
      `id, title, type, content, created_at, updated_at,
       author:users!articles_author_id_fkey ( id, full_name, email )`
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const article = data as unknown as ArticleFull;
  const canEdit =
    article.author.id === current.id || current.role === "admin";

  return <ArticleWorkspace article={article} canEdit={canEdit} canDelete={canEdit} />;
}
