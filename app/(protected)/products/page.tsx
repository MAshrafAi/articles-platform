import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ProductListItem } from "@/lib/products";
import { ProductsStatsBar } from "@/components/products/stats-bar";
import { ProductsFilters } from "@/components/products/products-filters";
import { ProductsTable } from "@/components/products/products-table";
import { CreateProductDialog } from "@/components/products/create-product-dialog";
import { RealtimeListener } from "@/components/realtime-listener";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  author?: string;
  sort?: "asc" | "desc";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const current = await requireUser();
  const params = await searchParams;
  const sort = params.sort === "asc" ? "asc" : "desc";

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      `id, title, product_url, keyword, status, created_at,
       author:users!products_author_id_fkey ( id, full_name, email )`
    );

  if (params.q) query = query.ilike("title", `${params.q}%`);
  if (params.author && current.role === "admin") {
    query = query.eq("author_id", params.author);
  }
  query = query.order("created_at", { ascending: sort === "asc" }).limit(100);

  const { data: productsData } = await query;
  const products = (productsData ?? []) as unknown as ProductListItem[];

  let authorsList: { id: string; full_name: string | null; email: string }[] = [];
  if (current.role === "admin") {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email")
      .order("full_name", { nullsFirst: false });
    authorsList = data ?? [];
  }

  // For stats: calculate days since first product
  let totalDays = 1;
  const { data: firstRows } = await supabase
    .from("products")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(1);
  if (firstRows?.[0]?.created_at) {
    const firstDate = new Date(firstRows[0].created_at);
    const now = new Date();
    totalDays = Math.max(1, Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <RealtimeListener tables={["products"]} />
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">المنتجات</h1>
          <p className="mt-1 text-sm text-slate-500">
            {current.role === "admin"
              ? "عرض وإدارة كل المنتجات على المنصة"
              : "إدارة المنتجات التي أنشأتها على المنصة"}
          </p>
        </div>
        <CreateProductDialog />
      </header>

      <ProductsStatsBar totalCount={products.length} totalDays={totalDays} />

      <ProductsFilters
        showAuthorFilter={current.role === "admin"}
        authorsList={authorsList}
      />

      <ProductsTable
        products={products}
        currentUserId={current.id}
        currentRole={current.role}
      />
    </div>
  );
}
