"use client";

import { useState, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Package, Plus, ArrowRight, Loader2, X, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  createInformationalArticleAction,
  createProductArticleAction,
} from "@/app/(protected)/articles/actions";
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
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 ring-offset-background placeholder:text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

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
};

const informationalSchema = z.object(baseSchema);
type InformationalFormValues = z.infer<typeof informationalSchema>;

const productSchema = z.object({
  ...baseSchema,
  productLinks: z
    .string()
    .min(1, "هذا الحقل مطلوب")
    .refine(
      (val) =>
        val
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0).length <= 5,
      "الحد الأقصى 5 روابط منتجات"
    ),
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
      language: "ar",
      keywords: "",
      title: "",
      audienceGender: "neutral",
      writingTone: "neutral",
      infoNotes: "",
      outlineNotes: "",
    },
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      language: "ar",
      keywords: "",
      title: "",
      productLinks: "",
      audienceGender: "neutral",
      writingTone: "neutral",
      infoNotes: "",
      outlineNotes: "",
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
    startTransition(async () => {
      const result = await createProductArticleAction({
        KW: data.keywords,
        title: data.title || undefined,
        language: data.language,
        audienceGender: data.audienceGender,
        writingTone: data.writingTone,
        productLinks: data.productLinks,
        infoNotes: data.infoNotes || undefined,
        outlineNotes: data.outlineNotes || undefined,
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

              <FormField label="الكلمة المفتاحية" required error={informationalForm.formState.errors.keywords?.message}>
                <input
                  {...informationalForm.register("keywords")}
                  placeholder="أدخل الكلمة المفتاحية الرئيسية للمقال"
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
                  placeholder="أدخل عنوان المقال أو اتركه ليتم توليده تلقائياً"
                  className={fieldCls}
                />
              </FormField>

              <FormField label="محاور إضافية للمقال">
                <textarea
                  {...informationalForm.register("infoNotes")}
                  placeholder="أدخل أي توجيهات أو محاور تريد تضمينها في المقال"
                  rows={3}
                  className={cn(fieldCls, "h-auto resize-none")}
                />
              </FormField>

              <FormField label="ملاحظات المخطط">
                <textarea
                  {...informationalForm.register("outlineNotes")}
                  placeholder="أدخل ملاحظات خاصة بهيكل المقال وترتيب أقسامه"
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

              <FormField label="الكلمة المفتاحية" required error={productForm.formState.errors.keywords?.message}>
                <input
                  {...productForm.register("keywords")}
                  placeholder="أدخل الكلمة المفتاحية الرئيسية للمقال"
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
                  placeholder="أدخل عنوان المقال أو اتركه ليتم توليده تلقائياً"
                  className={fieldCls}
                />
              </FormField>

              <FormField label="روابط المنتجات" required error={productForm.formState.errors.productLinks?.message}>
                <ProductLinksInput
                  value={productForm.watch("productLinks")}
                  onChange={(val) => productForm.setValue("productLinks", val, { shouldValidate: true })}
                  hasError={!!productForm.formState.errors.productLinks}
                />
              </FormField>

              <FormField label="محاور إضافية للمقال">
                <textarea
                  {...productForm.register("infoNotes")}
                  placeholder="أدخل أي توجيهات أو محاور تريد تضمينها في المقال"
                  rows={3}
                  className={cn(fieldCls, "h-auto resize-none")}
                />
              </FormField>

              <FormField label="ملاحظات المخطط">
                <textarea
                  {...productForm.register("outlineNotes")}
                  placeholder="أدخل ملاحظات خاصة بهيكل المقال وترتيب أقسامه"
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

// ─── ProductLinksInput ────────────────────────────────────────────────────────

function shortenUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname + (parsed.pathname.length > 1 ? "/…" : "");
  } catch {
    return url.length > 40 ? url.slice(0, 40) + "…" : url;
  }
}

function ProductLinksInput({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
}) {
  const [inputValue, setInputValue] = useState("");

  const links = value
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const addLink = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      // Support pasting multiple links at once
      const newLinks = trimmed
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !links.includes(l));
      if (newLinks.length === 0) return;
      const updated = [...links, ...newLinks].join("\n");
      onChange(updated);
      setInputValue("");
    },
    [links, onChange]
  );

  const removeLink = useCallback(
    (index: number) => {
      const updated = links.filter((_, i) => i !== index).join("\n");
      onChange(updated);
    },
    [links, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLink(inputValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes("\n")) {
      e.preventDefault();
      addLink(pasted);
    }
  };

  const isFull = links.length >= 5;

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-2 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        hasError ? "border-red-400" : "border-input"
      )}
    >
      {/* Links list */}
      {links.length > 0 && (
        <div className="mb-2 flex flex-col gap-1.5">
          {links.map((link, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span
                className="flex-1 truncate text-xs text-slate-600"
                title={link}
              >
                {shortenUrl(link)}
              </span>
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {!isFull && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            links.length === 0
              ? "أدخل رابط المنتج ثم اضغط Enter"
              : `أضف رابط آخر (${links.length}/5)`
          }
          className="w-full border-0 bg-transparent px-1 py-1 text-sm text-slate-900 placeholder:text-[13px] placeholder:text-muted-foreground focus:outline-none"
        />
      )}

      {isFull && (
        <p className="px-1 py-1 text-xs text-slate-400">
          تم الوصول للحد الأقصى (5 روابط)
        </p>
      )}
    </div>
  );
}
