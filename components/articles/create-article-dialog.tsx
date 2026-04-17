"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Package, Plus, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createInformationalArticleAction } from "@/app/(protected)/articles/actions";
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
import type { ArticleType } from "@/lib/articles";

// ─── Shared field styles ────────────────────────────────────────────────────────

const fieldCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const errorFieldCls = "border-red-400 focus:ring-red-400";

// ─── Schemas ────────────────────────────────────────────────────────────────────

const baseSchema = {
  language: z.string().min(1, "هذا الحقل مطلوب"),
  keywords: z.string().min(1, "هذا الحقل مطلوب"),
  title: z.string().optional(),
  audienceGender: z.string().min(1, "هذا الحقل مطلوب"),
  writingTone: z.string().min(1, "هذا الحقل مطلوب"),
  infoNotes: z.string().optional(),
  outlineNotes: z.string().optional(),
  writingNotes: z.string().optional(),
};

const informationalSchema = z.object(baseSchema);
type InformationalFormValues = z.infer<typeof informationalSchema>;

const productSchema = z.object({
  ...baseSchema,
  productLinks: z.string().min(1, "هذا الحقل مطلوب"),
});
type ProductFormValues = z.infer<typeof productSchema>;

// ─── Step type ──────────────────────────────────────────────────────────────────

type Step = "type" | "informational-form" | "product-form";

// ─── Main Component ─────────────────────────────────────────────────────────────

export function CreateArticleDialog() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ArticleType | null>(null);
  const [step, setStep] = useState<Step>("type");
  const [isPending, startTransition] = useTransition();

  const informationalForm = useForm<InformationalFormValues>({
    resolver: zodResolver(informationalSchema),
    defaultValues: {
      language: "",
      keywords: "",
      title: "",
      audienceGender: "",
      writingTone: "",
      infoNotes: "",
      outlineNotes: "",
      writingNotes: "",
    },
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      language: "",
      keywords: "",
      title: "",
      productLinks: "",
      audienceGender: "",
      writingTone: "",
      infoNotes: "",
      outlineNotes: "",
      writingNotes: "",
    },
  });

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setStep("type");
    informationalForm.reset();
    productForm.reset();
  };

  const handleContinue = () => {
    if (!selected) return;
    if (selected === "informational") {
      setStep("informational-form");
    } else {
      setStep("product-form");
    }
  };

  const onSubmitInformational = (data: InformationalFormValues) => {
    startTransition(async () => {
      const result = await createInformationalArticleAction({
        KW: data.keywords,
        title: data.title || undefined,
        language: data.language,
        audienceGender: data.audienceGender,
        writingTone: data.writingTone,
        infoNotes: data.infoNotes || undefined,
        outlineNotes: data.outlineNotes || undefined,
        writingNotes: data.writingNotes || undefined,
      });

      if (result.ok) {
        handleClose();
        toast.success("تم استلام الطلب", {
          description: "جاري توليد المقال في الخلفية، سيظهر في القائمة قريباً",
        });
      } else {
        toast.error("تعذّر إنشاء المقال", {
          description: result.error,
        });
      }
    });
  };

  const onSubmitProduct = (data: ProductFormValues) => {
    console.log("Product article request:", data);
    toast.success("تم إرسال الطلب بنجاح", {
      description: "سيتم معالجة طلب المقال وإعلامك عند الانتهاء",
    });
    handleClose();
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
        إنشاء مقال
      </DialogTrigger>

      {/* ── Step 1: Type selection ───────────────────────────────────────────── */}
      {step === "type" && (
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>إنشاء مقال جديد</DialogTitle>
            <DialogDescription>
              اختر نوع المقال للبدء — يحدد النوع مسار توليد المحتوى الخاص به
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <TypeOption
              type="informational"
              icon={<FileText className="h-6 w-6" />}
              title="مقال معلوماتي"
              description="أدلة، شروحات، مقالات تعليمية، ومحتوى SEO عام"
              selected={selected === "informational"}
              onSelect={() => setSelected("informational")}
            />
            <TypeOption
              type="product"
              icon={<Package className="h-6 w-6" />}
              title="مقال منتج"
              description="مراجعات ومقارنات منتجات، قوائم توصيات، ومحتوى تسويقي"
              selected={selected === "product"}
              onSelect={() => setSelected("product")}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              متابعة
            </button>
          </DialogFooter>
        </DialogContent>
      )}

      {/* ── Step 2a: Informational article form ─────────────────────────────── */}
      {step === "informational-form" && (
        <DialogContent dir="rtl" className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>كتابة مقال</DialogTitle>
            <DialogDescription>أدخل تفاصيل المقال</DialogDescription>
          </DialogHeader>

          <form onSubmit={informationalForm.handleSubmit(onSubmitInformational)} noValidate>
            <div className="flex flex-col gap-5 py-1">

              <div className="grid grid-cols-2 gap-4">
                <FormField label="اللغة" required error={informationalForm.formState.errors.language?.message}>
                  <Select
                    onValueChange={(v) => informationalForm.setValue("language", v, { shouldValidate: true })}
                    value={informationalForm.watch("language")}
                  >
                    <SelectTrigger dir="rtl" className={cn(fieldCls, informationalForm.formState.errors.language && errorFieldCls)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">الإنجليزية</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="صيغة الجمهور" required error={informationalForm.formState.errors.audienceGender?.message}>
                  <Select
                    onValueChange={(v) => informationalForm.setValue("audienceGender", v, { shouldValidate: true })}
                    value={informationalForm.watch("audienceGender")}
                  >
                    <SelectTrigger dir="rtl" className={cn(fieldCls, informationalForm.formState.errors.audienceGender && errorFieldCls)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="neutral">محايد</SelectItem>
                      <SelectItem value="male">مذكر</SelectItem>
                      <SelectItem value="female">مؤنث</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="الكلمات المفتاحية" required error={informationalForm.formState.errors.keywords?.message}>
                <input
                  {...informationalForm.register("keywords")}
                  className={cn(fieldCls, informationalForm.formState.errors.keywords && errorFieldCls)}
                />
              </FormField>

              <FormField label="نبرة الكتابة" required error={informationalForm.formState.errors.writingTone?.message}>
                <Select
                  onValueChange={(v) => informationalForm.setValue("writingTone", v, { shouldValidate: true })}
                  value={informationalForm.watch("writingTone")}
                >
                  <SelectTrigger dir="rtl" className={cn(fieldCls, informationalForm.formState.errors.writingTone && errorFieldCls)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="neutral">محايد</SelectItem>
                    <SelectItem value="friendly">ودّي</SelectItem>
                    <SelectItem value="conversational">حواري</SelectItem>
                    <SelectItem value="persuasive">إقناعي</SelectItem>
                    <SelectItem value="academic">أكاديمي</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="عنوان المقال">
                <input
                  {...informationalForm.register("title")}
                  className={fieldCls}
                />
              </FormField>

              <FormField label="ملاحظات المعلومات">
                <textarea
                  {...informationalForm.register("infoNotes")}
                  rows={3}
                  className={cn(fieldCls, "h-auto resize-none")}
                />
              </FormField>

              <FormField label="ملاحظات المخطط">
                <textarea
                  {...informationalForm.register("outlineNotes")}
                  rows={3}
                  className={cn(fieldCls, "h-auto resize-none")}
                />
              </FormField>

              <FormField label="ملاحظات الكتابة">
                <textarea
                  {...informationalForm.register("writingNotes")}
                  rows={3}
                  className={cn(fieldCls, "h-auto resize-none")}
                />
              </FormField>
            </div>

            <DialogFooter className="mt-6 gap-2 sm:gap-2">
              <button
                type="button"
                onClick={() => setStep("type")}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" />
                رجوع
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}

      {/* ── Step 2b: Product article form ───────────────────────────────────── */}
      {step === "product-form" && (
        <DialogContent dir="rtl" className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>كتابة مقال</DialogTitle>
            <DialogDescription>أدخل تفاصيل المقال وروابط المنتجات</DialogDescription>
          </DialogHeader>

          <form onSubmit={productForm.handleSubmit(onSubmitProduct)} noValidate>
            <div className="flex flex-col gap-5 py-1">

              <div className="grid grid-cols-2 gap-4">
                <FormField label="اللغة" required error={productForm.formState.errors.language?.message}>
                  <Select
                    onValueChange={(v) => productForm.setValue("language", v, { shouldValidate: true })}
                    value={productForm.watch("language")}
                  >
                    <SelectTrigger dir="rtl" className={cn(fieldCls, productForm.formState.errors.language && errorFieldCls)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">الإنجليزية</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="صيغة الجمهور" required error={productForm.formState.errors.audienceGender?.message}>
                  <Select
                    onValueChange={(v) => productForm.setValue("audienceGender", v, { shouldValidate: true })}
                    value={productForm.watch("audienceGender")}
                  >
                    <SelectTrigger dir="rtl" className={cn(fieldCls, productForm.formState.errors.audienceGender && errorFieldCls)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="neutral">محايد</SelectItem>
                      <SelectItem value="male">مذكر</SelectItem>
                      <SelectItem value="female">مؤنث</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="الكلمات المفتاحية" required error={productForm.formState.errors.keywords?.message}>
                <input
                  {...productForm.register("keywords")}
                  className={cn(fieldCls, productForm.formState.errors.keywords && errorFieldCls)}
                />
              </FormField>

              <FormField label="نبرة الكتابة" required error={productForm.formState.errors.writingTone?.message}>
                <Select
                  onValueChange={(v) => productForm.setValue("writingTone", v, { shouldValidate: true })}
                  value={productForm.watch("writingTone")}
                >
                  <SelectTrigger dir="rtl" className={cn(fieldCls, productForm.formState.errors.writingTone && errorFieldCls)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="neutral">محايد</SelectItem>
                    <SelectItem value="friendly">ودّي</SelectItem>
                    <SelectItem value="conversational">حواري</SelectItem>
                    <SelectItem value="persuasive">إقناعي</SelectItem>
                    <SelectItem value="academic">أكاديمي</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="عنوان المقال">
                <input
                  {...productForm.register("title")}
                  className={fieldCls}
                />
              </FormField>

              <FormField label="روابط المنتجات" required error={productForm.formState.errors.productLinks?.message}>
                <textarea
                  {...productForm.register("productLinks")}
                  rows={3}
                  className={cn(fieldCls, "h-auto resize-none", productForm.formState.errors.productLinks && errorFieldCls)}
                />
              </FormField>

              <FormField label="ملاحظات المعلومات">
                <textarea
                  {...productForm.register("infoNotes")}
                  rows={3}
                  className={cn(fieldCls, "h-auto resize-none")}
                />
              </FormField>

              <FormField label="ملاحظات المخطط">
                <textarea
                  {...productForm.register("outlineNotes")}
                  rows={3}
                  className={cn(fieldCls, "h-auto resize-none")}
                />
              </FormField>

              <FormField label="ملاحظات الكتابة">
                <textarea
                  {...productForm.register("writingNotes")}
                  rows={3}
                  className={cn(fieldCls, "h-auto resize-none")}
                />
              </FormField>
            </div>

            <DialogFooter className="mt-6 gap-2 sm:gap-2">
              <button
                type="button"
                onClick={() => setStep("type")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowRight className="h-4 w-4" />
                رجوع
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                إرسال الطلب
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}

// ─── FormField wrapper ──────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, required, error, children }: FormFieldProps) {
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

// ─── TypeOption ─────────────────────────────────────────────────────────────────

interface TypeOptionProps {
  type: ArticleType;
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

function TypeOption({ icon, title, description, selected, onSelect }: TypeOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border p-4 text-start transition-all",
        selected
          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <span
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          selected
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </button>
  );
}
