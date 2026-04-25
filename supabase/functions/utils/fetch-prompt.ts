import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

/**
 * Fetches the editable portion of a prompt from public.prompts.
 * Falls back to the provided default on any error (missing row, DB hiccup, etc.)
 * so generation never breaks on DB issues.
 */
export async function fetchPrompt(
  supabase: SupabaseClient,
  key: string,
  fallback: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("prompts")
      .select("editable_content")
      .eq("key", key)
      .maybeSingle();
    if (error || !data?.editable_content) return fallback;
    return data.editable_content as string;
  } catch {
    return fallback;
  }
}
