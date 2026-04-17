"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link2, Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteUserAction } from "@/app/(protected)/settings/roles/actions";
import type { UserRole } from "@/lib/auth";

type GeneratedInvite = { email: string; link: string };

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [pending, startTransition] = useTransition();
  const [generated, setGenerated] = useState<GeneratedInvite | null>(null);
  const [copied, setCopied] = useState(false);

  const resetAll = () => {
    setEmail("");
    setRole("employee");
    setGenerated(null);
    setCopied(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteUserAction({
        email: email.trim(),
        role,
      });
      if (result.ok) {
        setGenerated({ email: result.email, link: result.inviteLink });
        toast.success("تم إنشاء رابط الدعوة بنجاح");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.link);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذّر النسخ، انسخ الرابط يدوياً");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) resetAll();
      }}
    >
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800">
        <UserPlus className="h-4 w-4" />
        دعوة مستخدم
      </DialogTrigger>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle>
            {generated ? "تم إنشاء رابط الدعوة" : "دعوة مستخدم جديد"}
          </DialogTitle>
          <DialogDescription>
            {generated
              ? "انسخ الرابط أدناه وأرسله للمستخدم بأي طريقة تفضّلها. الرابط صالح لفترة محدودة."
              : "سيتم إنشاء رابط دعوة خاص بالمستخدم، انسخه وأرسله له بأي وسيلة."}
          </DialogDescription>
        </DialogHeader>

        {generated ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-500">المدعو</p>
                <p
                  dir="ltr"
                  className="truncate text-start text-sm font-medium text-slate-800"
                  title={generated.email}
                >
                  {generated.email}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700">رابط الدعوة</Label>
                <span className="text-[11px] text-slate-400">
                  اضغط على الرابط لنسخه
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="group relative block w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-start transition-all hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                title="اضغط للنسخ"
              >
                <div className="flex items-start gap-2.5 px-3 py-2.5 pe-12">
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-500" />
                  <span
                    dir="ltr"
                    className="block flex-1 break-all text-start font-mono text-[11px] leading-relaxed text-slate-700"
                  >
                    {generated.link}
                  </span>
                </div>
                <span
                  className={`absolute top-2 end-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                    copied
                      ? "bg-green-100 text-green-700"
                      : "bg-white text-slate-600 shadow-sm group-hover:bg-slate-900 group-hover:text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      نسخ
                    </>
                  )}
                </span>
              </button>

              <p className="text-[11px] leading-relaxed text-slate-500">
                أرسل الرابط للمستخدم بأي طريقة (واتساب، سلاك…). عند فتحه سيُوجَّه لصفحة إكمال التسجيل لإدخال اسمه وكلمة السر.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                دعوة مستخدم آخر
              </button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">البريد الإلكتروني</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                dir="ltr"
                className="text-start"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">الدور</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="admin">أدمن</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                إنشاء رابط الدعوة
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
