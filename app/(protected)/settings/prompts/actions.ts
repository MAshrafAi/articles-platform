"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { PROMPT_KEYS } from "./constants";

export type UpdatePromptResult = { ok: true } | { ok: false; error: string };

const UpdateSchema = z.object({
  key: z.enum(PROMPT_KEYS),
  content: z
    .string()
    .min(10, "المحتوى قصير جدًا")
    .max(20000, "المحتوى طويل جدًا"),
});

export async function updatePromptAction(input: {
  key: string;
  content: string;
}): Promise<UpdatePromptResult> {
  const current = await requireAdmin();

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "مدخلات غير صالحة",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("prompts")
    .update({
      editable_content: parsed.data.content,
      updated_by: current.id,
    })
    .eq("key", parsed.data.key);

  if (error) {
    console.error("[updatePromptAction] upsert failed:", {
      key: parsed.data.key,
      code: error.code,
      message: error.message,
    });
    return { ok: false, error: "تعذّر حفظ البرومت" };
  }

  revalidatePath("/settings/prompts");
  return { ok: true };
}
