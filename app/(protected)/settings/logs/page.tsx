import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ArticleLogItem, ArticleStatus, ArticleType } from "@/lib/articles";
import { LogsFilters } from "@/components/logs/logs-filters";
import { LogsTable } from "@/components/logs/logs-table";

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: ArticleStatus;
  type?: ArticleType;
  sort?: "asc" | "desc";
  author?: string;
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const sort = params.sort === "asc" ? "asc" : "desc";

  let query = supabaseAdmin
    .from("articles")
    .select(
      `id, title, type, status, pipeline_logs, created_at,
       author:users!articles_author_id_fkey ( id, full_name, email )`
    );

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.type) {
    query = query.eq("type", params.type);
  }
  if (params.author) {
    query = query.eq("author_id", params.author);
  }

  query = query.order("created_at", { ascending: sort === "asc" }).limit(200);

  const { data: articlesData } = await query;
  const articles = (articlesData ?? []) as unknown as ArticleLogItem[];

  // Authors list for filter dropdown
  const { data: usersData } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email")
    .order("full_name", { nullsFirst: false });
  const authorsList = usersData ?? [];

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">سجل المقالات</h1>
        <p className="mt-1 text-sm text-slate-500">
          متابعة حالة توليد المقالات ومراحل سير العمل
        </p>
      </header>

      <LogsFilters authorsList={authorsList} />
      <LogsTable articles={articles} />
    </div>
  );
}
