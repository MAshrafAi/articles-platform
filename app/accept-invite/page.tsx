import { redirect } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AcceptInviteForm } from "./accept-invite-form";

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login?error=invalid_link");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.email.toLowerCase() !== user.email.toLowerCase()) {
    await supabase.auth.signOut();
    redirect("/login?error=invalid_invite");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-slate-200 via-slate-100 to-transparent blur-3xl" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-[460px]">
          <div className="mb-6 text-center sm:mb-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 shadow-sm">
              <span className="text-xl font-bold text-white">م</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              إكمال إنشاء الحساب
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              مرحبًا بك في منصة محتوى — يُرجى تعيين كلمة السر لإكمال التسجيل
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  البريد الإلكتروني للدعوة
                </label>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  <Lock className="h-3 w-3" />
                  مقفل
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <span
                  dir="ltr"
                  className="flex-1 truncate text-sm font-medium text-slate-800"
                >
                  {user.email}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                هذا البريد محدد مسبقًا من قبل مسؤول المنصة ولا يمكن تغييره. لإكمال التسجيل، أكمل تعيين كلمة السر أدناه.
              </p>
            </div>

            <AcceptInviteForm />
          </div>
        </div>
      </div>
    </div>
  );
}
