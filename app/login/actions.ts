"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error: string | null } | null;

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "الرجاء تعبئة البريد الإلكتروني وكلمة السر" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  // Extra authorization check: must exist in public.users
  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "ليس لديك صلاحية الدخول إلى المنصة" };
  }

  redirect("/articles");
}
