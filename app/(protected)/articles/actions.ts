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

  // Create article record immediately with status='generating'
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

  // Fire Edge Function — awaited for debugging
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const edgeFnUrl = `${supabaseUrl}/functions/v1/generate-informational-article`;

  console.log("[Edge Function] calling:", edgeFnUrl);
  console.log("[Edge Function] articleId:", article.id);
  console.log("[Edge Function] supabaseUrl defined:", !!supabaseUrl);
  console.log("[Edge Function] serviceRoleKey defined:", !!serviceRoleKey);

  try {
    const res = await fetch(edgeFnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        articleId: article.id,
        authorId: user.id,
        ...input,
      }),
    });
    console.log("[Edge Function] HTTP status:", res.status);
    const body = await res.text();
    console.log("[Edge Function] response body:", body);
  } catch (err) {
    console.error("[Edge Function] fetch failed:", err);
  }

  revalidatePath("/articles");
  return { ok: true, articleId: article.id };
}
