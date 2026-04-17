import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "employee";

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, email, full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (data as AppUser | null) ?? null;
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard?error=forbidden");
  return user;
}
