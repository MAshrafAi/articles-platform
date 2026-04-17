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
