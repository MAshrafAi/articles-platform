"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CallbackClient() {
  const router = useRouter();
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
      router.replace(path);
    };

    (async () => {
      if (errorDescription) {
        finish("/login?error=invalid_link");
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
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
          finish("/login?error=invalid_link");
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            finish("/login?error=invalid_link");
            return;
          }
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname);
          }
          finish(next);
          return;
        }
      }

      finish("/login?error=invalid_link");
    })();
  }, [router, searchParams]);

  return null;
}
