"use server";

import { revalidatePath } from "next/cache";
import type { JSONContent } from "@tiptap/react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fireEdgeFunction(
  fnName: string,
  payload: Record<string, unknown>
): void {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const edgeFnUrl = `${supabaseUrl}/functions/v1/${fnName}`;

  console.log(`[Edge Function] calling: ${edgeFnUrl}`);

  fetch(edgeFnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      console.log(`[Edge Function] ${fnName} HTTP status:`, res.status);
      const body = await res.text();
      console.log(`[Edge Function] ${fnName} response:`, body);
    })
    .catch((err) => {
      console.error(`[Edge Function] ${fnName} fetch failed:`, err);
    });
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function updateProductAction(input: {
  id: string;
  title: string | null;
  content: JSONContent;
}): Promise<ActionResult> {
  await requireUser();

  const title = input.title?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ title, content: input.content })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "تعذّر حفظ التغييرات" };
  }

  revalidatePath(`/products/${input.id}`);
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteProductAction(input: {
  productId: string;
}): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", input.productId);

  if (error) {
    return { ok: false, error: "تعذّر حذف المنتج" };
  }

  revalidatePath("/products");
  return { ok: true };
}

// ─── Product enhancement ─────────────────────────────────────────────────────

export interface CreateProductInput {
  productUrl: string;
  keyword: string;
  language: string;
  notes?: string;
}

export async function createProductAction(
  input: CreateProductInput
): Promise<ActionResult & { productId?: string }> {
  const user = await requireUser();

  const supabase = await createClient();

  const { data: product, error: insertError } = await supabase
    .from("products")
    .insert({
      author_id: user.id,
      product_url: input.productUrl.trim(),
      keyword: input.keyword.trim(),
      title: input.keyword.trim(),
      status: "generating",
    })
    .select("id")
    .single();

  if (insertError || !product) {
    return { ok: false, error: "تعذّر إنشاء المنتج" };
  }

  fireEdgeFunction("generate-product-description", {
    productId: product.id,
    authorId: user.id,
    productUrl: input.productUrl.trim(),
    keyword: input.keyword.trim(),
    language: input.language,
    notes: input.notes,
  });

  revalidatePath("/products");
  return { ok: true, productId: product.id };
}
