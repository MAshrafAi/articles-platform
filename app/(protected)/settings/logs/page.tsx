import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ArticleLogItem, ArticleStatus, ArticleType } from "@/lib/articles";
import type { ProductLogItem } from "@/lib/products";
import { LogsPageClient } from "@/components/logs/logs-page-client";
import { RealtimeListener } from "@/components/realtime-listener";

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

  // Fetch articles
  let articlesQuery = supabaseAdmin
    .from("articles")
    .select(
      `id, title, type, status, pipeline_logs, created_at,
       author:users!articles_author_id_fkey ( id, full_name, email )`
    );

  if (params.status) articlesQuery = articlesQuery.eq("status", params.status);
  if (params.type) articlesQuery = articlesQuery.eq("type", params.type);
  if (params.author) articlesQuery = articlesQuery.eq("author_id", params.author);
  articlesQuery = articlesQuery.order("created_at", { ascending: sort === "asc" }).limit(200);

  // Fetch products
  let productsQuery = supabaseAdmin
    .from("products")
    .select(
      `id, title, status, pipeline_logs, created_at,
       author:users!products_author_id_fkey ( id, full_name, email )`
    );

  if (params.status) productsQuery = productsQuery.eq("status", params.status);
  if (params.author) productsQuery = productsQuery.eq("author_id", params.author);
  productsQuery = productsQuery.order("created_at", { ascending: sort === "asc" }).limit(200);

  const [{ data: articlesData }, { data: productsData }, { data: usersData }] =
    await Promise.all([
      articlesQuery,
      productsQuery,
      supabaseAdmin
        .from("users")
        .select("id, full_name, email")
        .order("full_name", { nullsFirst: false }),
    ]);

  const articles = (articlesData ?? []) as unknown as ArticleLogItem[];
  const products = (productsData ?? []) as unknown as ProductLogItem[];
  const authorsList = usersData ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <RealtimeListener tables={["articles", "products"]} />
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">السجل</h1>
        <p className="mt-1 text-sm text-slate-500">
          متابعة حالة توليد المقالات والمنتجات ومراحل سير عملهم
        </p>
      </header>

      <LogsPageClient
        articles={articles}
        products={products}
        authorsList={authorsList}
      />
    </div>
  );
}
