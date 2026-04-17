"use server";

import { revalidatePath } from "next/cache";
import type { JSONContent } from "@tiptap/react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateArticleAction(input: {
  id: string;
  title: string | null;
  content: JSONContent;
}): Promise<ActionResult> {
  await requireUser();

  const title = input.title?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ title, content: input.content })
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: "تعذّر حفظ التغييرات" };
  }

  revalidatePath(`/articles/${input.id}`);
  revalidatePath("/articles");
  return { ok: true };
}

export async function deleteArticleAction(input: {
  articleId: string;
}): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", input.articleId);

  if (error) {
    return { ok: false, error: "تعذّر حذف المقال" };
  }

  revalidatePath("/articles");
  return { ok: true };
}

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

// ─── Informational article generation ────────────────────────────────────────

export interface InformationalArticleInput {
  KW: string;
  title?: string;
  language: string;
  audienceGender: string;
  writingTone: string;
  infoNotes?: string;
  outlineNotes?: string;
  writingNotes?: string;
}

export async function createInformationalArticleAction(
  input: InformationalArticleInput
): Promise<ActionResult & { articleId?: string }> {
  const user = await requireUser();

  const supabase = await createClient();

  const { data: article, error: insertError } = await supabase
    .from("articles")
    .insert({
      type: "informational",
      author_id: user.id,
      title: input.title?.trim() || input.KW,
      status: "generating",
    })
    .select("id")
    .single();

  if (insertError || !article) {
    return { ok: false, error: "تعذّر إنشاء المقال" };
  }

  // Fire-and-forget — the Edge Function updates the article async
  fireEdgeFunction("generate-informational-article", {
    articleId: article.id,
    authorId: user.id,
    ...input,
  });

  revalidatePath("/articles");
  return { ok: true, articleId: article.id };
}

// ─── Product article generation ──────────────────────────────────────────────

export interface ProductArticleInput {
  KW: string;
  title?: string;
  language: string;
  audienceGender: string;
  writingTone: string;
  productLinks: string;
  infoNotes?: string;
  outlineNotes?: string;
  writingNotes?: string;
}

export async function createProductArticleAction(
  input: ProductArticleInput
): Promise<ActionResult & { articleId?: string }> {
  const user = await requireUser();

  // Validate max 5 links
  const linkCount = input.productLinks
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length;

  if (linkCount === 0) {
    return { ok: false, error: "يجب إدخال رابط منتج واحد على الأقل" };
  }
  if (linkCount > 5) {
    return { ok: false, error: "الحد الأقصى 5 روابط منتجات" };
  }

  const supabase = await createClient();

  const { data: article, error: insertError } = await supabase
    .from("articles")
    .insert({
      type: "product",
      author_id: user.id,
      title: input.title?.trim() || input.KW,
      status: "generating",
    })
    .select("id")
    .single();

  if (insertError || !article) {
    return { ok: false, error: "تعذّر إنشاء المقال" };
  }

  fireEdgeFunction("generate-product-article", {
    articleId: article.id,
    authorId: user.id,
    ...input,
  });

  revalidatePath("/articles");
  return { ok: true, articleId: article.id };
}
