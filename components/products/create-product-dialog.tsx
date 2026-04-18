"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProductAction } from "@/app/(protected)/products/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fieldCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 ring-offset-background placeholder:text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const errorFieldCls = "border-red-400 focus:ring-red-400";

const schema = z.object({
  language: z.string().min(1, "هذا الحقل مطلوب"),
  productUrl: z.string().url("أدخل رابط صالح").min(1, "هذا الحقل مطلوب"),
  keyword: z.string().min(1, "هذا الحقل مطلوب"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      language: "ar",
      productUrl: "",
      keyword: "",
      notes: "",
    },
  });

  const handleClose = () => {
    setOpen(false);
    form.reset();
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await createProductAction({
        productUrl: data.productUrl,
        keyword: data.keyword,
        language: data.language,
        notes: data.notes || undefined,
      });

      if (result.ok) {
        handleClose();
        toast.success("تم استلام الطلب", {
          description: "جاري تحسين المنتج في الخلفية، سيظهر في القائمة قريباً",
        });
      } else {
        toast.error("تعذّر إنشاء المنتج", {
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800">
        <Plus className="h-4 w-4" />
        تحسين منتج
      </DialogTrigger>

      <DialogContent dir="rtl" className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle>إعداد المنتجات</DialogTitle>
          <DialogDescription>أدخل تفاصيل المنتج لبدء التحسين</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-5 py-1">
            <FormField label="اللغة" required error={form.formState.errors.language?.message}>
              <Select
                onValueChange={(v) => form.setValue("language", v, { shouldValidate: true })}
                value={form.watch("language")}
              >
                <SelectTrigger dir="rtl" className={cn(fieldCls, form.formState.errors.language && errorFieldCls)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">الإنجليزية</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="رابط المنتج" required error={form.formState.errors.productUrl?.message}>
              <input
                {...form.register("productUrl")}
                placeholder="أدخل رابط المنتج"
                className={cn(fieldCls, form.formState.errors.productUrl && errorFieldCls)}
              />
            </FormField>

            <FormField label="الكلمة المفتاحية" required error={form.formState.errors.keyword?.message}>
              <input
                {...form.register("keyword")}
                placeholder="أدخل الكلمة المفتاحية"
                className={cn(fieldCls, form.formState.errors.keyword && errorFieldCls)}
              />
            </FormField>

            <FormField label="ملاحظات إضافية">
              <textarea
                {...form.register("notes")}
                placeholder="أدخل ملاحظاتك هنا"
                rows={3}
                className={cn(fieldCls, "h-auto resize-none")}
              />
            </FormField>
          </div>

          <DialogFooter className="mt-6 gap-2 sm:gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "جاري الإرسال..." : "تحسين منتج"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ms-1 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
