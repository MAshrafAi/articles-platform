"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CallbackClient() {
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const next = searchParams.get("next") ?? "/accept-invite";
    const code = searchParams.get("code");
    const errorDescription = searchParams.get("error_description");

    const supabase = createClient();

    const finish = (path: string) => {
      window.location.href = path;
    };

    (async () => {
      if (errorDescription) {
        console.error("[auth/callback] error_description in query:", errorDescription);
        finish("/login?error=invalid_link");
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[auth/callback] exchangeCodeForSession failed:", error);
          finish("/login?error=invalid_link");
          return;
        }
        finish(next);
        return;
      }

      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash && hash.length > 1) {
        const params = new URLSearchParams(hash.slice(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const hashError = params.get("error_description");

        if (hashError) {
          console.error("[auth/callback] error_description in hash:", hashError);
          finish("/login?error=invalid_link");
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error("[auth/callback] setSession failed:", error);
            finish("/login?error=invalid_link");
            return;
          }
          finish(next);
          return;
        }

        console.error("[auth/callback] hash missing access_token or refresh_token", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });
      }

      console.error("[auth/callback] no code, no valid hash — cannot process callback");
      finish("/login?error=invalid_link");
    })();
  }, [searchParams]);

  return null;
}
