import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveRange, type DateRangePreset } from "@/lib/date-range";
import type { ArticleListItem } from "@/lib/articles";
import { StatsBar } from "@/components/articles/stats-bar";
import { ArticlesFilters } from "@/components/articles/articles-filters";
import { ArticlesTable } from "@/components/articles/articles-table";
import { CreateArticleDialog } from "@/components/articles/create-article-dialog";
import { RealtimeListener } from "@/components/realtime-listener";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

interface SearchParams {
  preset?: DateRangePreset;
  from?: string;
  to?: string;
  q?: string;
  author?: string;
  sort?: "asc" | "desc";
  error?: string;
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const current = await requireUser();
  const params = await searchParams;
  const { range, preset } = resolveRange(params);
  const sort = params.sort === "asc" ? "asc" : "desc";

  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select(
      `id, title, type, status, created_at,
       author:users!articles_author_id_fkey ( id, full_name, email )`
    );

  if (range.from) query = query.gte("created_at", range.from.toISOString());
  if (range.to) query = query.lte("created_at", range.to.toISOString());
  if (params.q) query = query.ilike("title", `${params.q}%`);
  if (params.author && current.role === "admin") {
    query = query.eq("author_id", params.author);
  }
  query = query.order("created_at", { ascending: sort === "asc" }).limit(100);

  const { data: articlesData } = await query;
  const articles = (articlesData ?? []) as unknown as ArticleListItem[];

  // Authors list (admin only) — use service role to bypass RLS and see all users
  let authorsList: { id: string; full_name: string | null; email: string }[] = [];
  if (current.role === "admin") {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email")
      .order("full_name", { nullsFirst: false });
    authorsList = data ?? [];
  }

  // For stats: earliest article date (used when preset = all for daily-avg denominator)
  let firstArticleDate: Date | null = null;
  if (!range.from) {
    const { data: firstRows } = await supabase
      .from("articles")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1);
    if (firstRows?.[0]?.created_at) {
      firstArticleDate = new Date(firstRows[0].created_at);
    }
  }

  void preset; // used only inside filters via searchParams

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <RealtimeListener tables={["articles"]} />
      {params.error === "forbidden" && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            ليس لديك صلاحية للوصول إلى تلك الصفحة
          </AlertDescription>
        </Alert>
      )}

      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">المقالات</h1>
          <p className="mt-1 text-sm text-slate-500">
            {current.role === "admin"
              ? "عرض وإدارة كل المقالات المنشورة على المنصة"
              : "إدارة المقالات التي أنشأتها على المنصة"}
          </p>
        </div>
        <CreateArticleDialog />
      </header>

      <StatsBar
        totalCount={articles.length}
        range={range}
        firstArticleDate={firstArticleDate}
      />

      <ArticlesFilters
        showAuthorFilter={current.role === "admin"}
        authorsList={authorsList}
      />

      <ArticlesTable
        articles={articles}
        currentUserId={current.id}
        currentRole={current.role}
      />
    </div>
  );
}
