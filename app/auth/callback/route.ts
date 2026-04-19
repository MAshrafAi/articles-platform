import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars");
  }

  let response = NextResponse.redirect(`${origin}${safeNext}`);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.redirect(`${origin}${safeNext}`);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

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

  return response;
}
