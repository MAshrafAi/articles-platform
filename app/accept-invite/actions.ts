"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AcceptInviteState = { error: string | null } | null;

export async function acceptInviteAction(
  _prevState: AcceptInviteState,
  formData: FormData
): Promise<AcceptInviteState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "يرجى إدخال الاسم الكامل" };
  }
  if (password.length < 8) {
    return { error: "يجب أن تتكون كلمة السر من 8 أحرف على الأقل" };
  }
  if (password !== confirmPassword) {
    return { error: "كلمتا السر غير متطابقتين" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "انتهت صلاحية الدعوة، الرجاء طلب دعوة جديدة" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.email.toLowerCase() !== user.email.toLowerCase()) {
    await supabase.auth.signOut();
    return {
      error: "البريد الإلكتروني لا يطابق الدعوة، الرجاء استخدام الرابط الأصلي من بريد الدعوة",
    };
  }

  const { error: updateAuthError } = await supabase.auth.updateUser({ password });
  if (updateAuthError) {
    return { error: "تعذر حفظ كلمة السر، حاول مرة أخرى" };
  }

  const { error: updateProfileError } = await supabase
    .from("users")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (updateProfileError) {
    return { error: "تعذر حفظ الاسم، حاول مرة أخرى" };
  }

  redirect("/dashboard");
}
