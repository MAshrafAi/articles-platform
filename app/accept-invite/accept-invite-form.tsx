"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInviteAction, type AcceptInviteState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-11 w-full gap-2 text-base">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      <span>{pending ? "جارٍ الحفظ…" : "إنشاء الحساب"}</span>
    </Button>
  );
}

export function AcceptInviteForm() {
  const [state, formAction] = useActionState<AcceptInviteState, FormData>(
    acceptInviteAction,
    null
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name" className="text-slate-700">
          الاسم الكامل
        </Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          placeholder="مثال: أحمد محمد"
          className="h-11"
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
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="8 أحرف على الأقل"
          className="h-11 text-left"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password" className="text-slate-700">
          تأكيد كلمة السر
        </Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="h-11 text-left"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
