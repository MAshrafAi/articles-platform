import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-slate-200 via-slate-100 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-tl from-sky-100 via-sky-50 to-transparent blur-3xl" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 shadow-sm">
              <span className="text-xl font-bold text-white">م</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              منصة المقالات
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              سجّل الدخول للوصول إلى لوحة التحكم
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            الحسابات تُنشأ بدعوة من مسؤول المنصة فقط
          </p>
        </div>
      </div>
    </div>
  );
}
