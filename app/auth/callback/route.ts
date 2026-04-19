import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = [
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "signup",
  "email",
];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const tokenHash = url.searchParams.get("token_hash");
  const rawType = url.searchParams.get("type");
  const nextParam = url.searchParams.get("next") ?? "/accept-invite";
  const safeNext = nextParam.startsWith("/") ? nextParam : "/accept-invite";

  if (!tokenHash || !rawType || !ALLOWED_TYPES.includes(rawType as EmailOtpType)) {
    console.error("[auth/callback] missing or invalid params", {
      hasTokenHash: !!tokenHash,
      type: rawType,
    });
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: rawType as EmailOtpType,
  });

  if (error) {
    console.error("[auth/callback] verifyOtp failed:", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
