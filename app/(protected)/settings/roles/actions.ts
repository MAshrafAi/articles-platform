"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin, type UserRole } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type InviteResult =
  | { ok: true; inviteLink: string; email: string }
  | { ok: false; error: string };

async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function inviteUserAction(input: {
  email: string;
  role: UserRole;
}): Promise<InviteResult> {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  const role = input.role;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "البريد الإلكتروني غير صالح" };
  }
  if (role !== "admin" && role !== "employee") {
    return { ok: false, error: "دور غير مدعوم" };
  }

  const siteUrl = await getSiteUrl();
  const redirectTo = `${siteUrl}/auth/callback`;

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });

  if (error || !data.user || !data.properties?.action_link) {
    console.error("[inviteUserAction] generateLink failed:", {
      email,
      status: error?.status,
      code: error?.code,
      message: error?.message,
      name: error?.name,
    });
    const msg = error?.message?.toLowerCase() ?? "";
    const code = error?.code ?? "";
    if (msg.includes("already") || code === "email_exists" || code === "user_already_exists") {
      return { ok: false, error: "هذا البريد مستخدم بالفعل" };
    }
    return { ok: false, error: error?.message || "تعذّر إنشاء رابط الدعوة، حاول مرة أخرى" };
  }

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    id: data.user.id,
    email,
    full_name: null,
    role,
  });

  if (insertError) {
    console.error("[inviteUserAction] users insert failed:", {
      email,
      userId: data.user.id,
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
    });
    await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => {});
    return { ok: false, error: `تعذّر حفظ بيانات المستخدم: ${insertError.message}` };
  }

  revalidatePath("/settings/roles");
  return { ok: true, inviteLink: data.properties.action_link, email };
}

export async function changeUserRoleAction(input: {
  userId: string;
  newRole: UserRole;
}): Promise<ActionResult> {
  const current = await requireAdmin();

  if (input.newRole !== "admin" && input.newRole !== "employee") {
    return { ok: false, error: "دور غير مدعوم" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ role: input.newRole })
    .eq("id", input.userId);

  if (error) {
    if (error.message?.includes("آخر أدمن")) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "تعذّر تحديث الدور" };
  }

  // revalidate even if user updated their own row
  void current;
  revalidatePath("/settings/roles");
  return { ok: true };
}

export async function deleteUserAction(input: {
  userId: string;
}): Promise<ActionResult> {
  const current = await requireAdmin();

  if (input.userId === current.id) {
    return { ok: false, error: "لا يمكنك حذف حسابك الشخصي" };
  }

  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
    input.userId
  );

  if (deleteAuthError) {
    const msg = deleteAuthError.message ?? "";
    if (msg.includes("آخر أدمن")) {
      return { ok: false, error: msg };
    }
    return { ok: false, error: "تعذّر حذف المستخدم" };
  }

  revalidatePath("/settings/roles");
  return { ok: true };
}
