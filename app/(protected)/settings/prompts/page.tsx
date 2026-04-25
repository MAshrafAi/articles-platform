import { unstable_noStore as noStore } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PromptsWorkflowClient,
  type PromptData,
} from "./prompts-workflow-client";
import { PROMPT_KEYS, type PromptKey } from "./constants";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  noStore();
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("prompts")
    .select("key, editable_content, default_content, updated_at");

  if (error) {
    console.error("[PromptsPage] failed to read prompts:", error);
  }

  const rowByKey = new Map<
    string,
    { editable_content: string; default_content: string; updated_at: string }
  >();
  for (const row of data ?? []) {
    rowByKey.set(row.key as string, {
      editable_content: row.editable_content as string,
      default_content: row.default_content as string,
      updated_at: row.updated_at as string,
    });
  }

  const prompts = {} as Record<PromptKey, PromptData>;
  for (const key of PROMPT_KEYS) {
    const row = rowByKey.get(key);
    prompts[key] = {
      key,
      editable: row?.editable_content ?? "",
      default: row?.default_content ?? "",
      updatedAt: row?.updated_at ?? null,
    };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          البرومتات
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          برومبتات مراحل توليد المحتوى — أي تعديل يطبّق فوراً على عمليات التوليد القادمة
        </p>
      </header>

      <PromptsWorkflowClient prompts={prompts} />
    </div>
  );
}
