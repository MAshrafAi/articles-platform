import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ProductListItem } from "@/lib/products";
import { ProductsFilters } from "@/components/products/products-filters";
import { ProductsTable } from "@/components/products/products-table";
import { CreateProductDialog } from "@/components/products/create-product-dialog";

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

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">المنتجات</h1>
          <p className="mt-1 text-sm text-slate-500">
            {current.role === "admin"
              ? "عرض وإدارة كل المنتجات على المنصة"
              : "إدارة المنتجات التي أنشأتها على المنصة"}
          </p>
        </div>
        <CreateProductDialog />
      </header>

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
