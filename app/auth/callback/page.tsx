import { Suspense } from "react";
import { CallbackClient } from "./callback-client";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
        <p className="text-sm text-slate-500">جارٍ التحقق من الدعوة…</p>
      </div>
      <Suspense fallback={null}>
        <CallbackClient />
      </Suspense>
    </div>
  );
}
