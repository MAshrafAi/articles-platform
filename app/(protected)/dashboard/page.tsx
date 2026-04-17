import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  const { error } = await searchParams;
  const greeting = user?.full_name || user?.email.split("@")[0] || "";

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          أهلاً بك{greeting ? `، ${greeting}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          لوحة التحكم — المحتوى يُضاف في المراحل القادمة
        </p>
      </header>

      {error === "forbidden" && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            ليس لديك صلاحية للوصول إلى تلك الصفحة
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">
          سيُعرض هنا مؤشرات المقالات وسجل التشغيلات لاحقاً
        </p>
      </div>
    </div>
  );
}
