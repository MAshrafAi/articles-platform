import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductWorkspace } from "@/components/products/product-workspace";
import type { ProductFull } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await requireUser();

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      `id, title, product_url, keyword, content, status, created_at, updated_at,
       author:users!products_author_id_fkey ( id, full_name, email )`
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const product = data as unknown as ProductFull;
  const canEdit =
    product.author.id === current.id || current.role === "admin";

  return <ProductWorkspace product={product} canEdit={canEdit} canDelete={canEdit} />;
}
