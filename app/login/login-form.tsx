"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, LogIn } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type SignInState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full gap-2 text-base"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      <span>{pending ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}</span>
    </Button>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [state, formAction] = useActionState<SignInState, FormData>(
    signInAction,
    null
  );

  const urlErrorMessages: Record<string, string> = {
    no_access: "ليس لديك صلاحية الدخول إلى المنصة",
    invalid_link: "رابط الدعوة غير صالح أو انتهت صلاحيته، اطلب دعوة جديدة",
    invalid_invite: "البريد الإلكتروني لا يطابق الدعوة، الرجاء استخدام الرابط الأصلي من بريد الدعوة",
  };
  const errorMessage =
    state?.error ?? (urlError ? urlErrorMessages[urlError] ?? null : null);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {errorMessage && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-700">
          البريد الإلكتروني
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="h-11 text-left"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700">
          كلمة السر
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="h-11 text-left"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
