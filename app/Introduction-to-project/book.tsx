"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Code2,
  Database,
  Edit3,
  Eye,
  FileSearch,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Link2,
  MessageCircleQuestion,
  ScanLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* ============== Pages ============== */

function IntroPage() {
  return (
    <div className="flex h-full flex-col book-stagger">
      {/* Cover header */}
      <div className="flex flex-col items-center pb-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 shadow-sm sm:h-14 sm:w-14">
          <span className="text-lg font-bold text-white sm:text-xl">م</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
          منصة محتوى
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          عرض تقديمي مُصمم لـ{" "}
          <span className="font-semibold text-slate-900">شركة مكاسب</span>
        </p>
      </div>

      <div className="mx-auto h-px w-20 bg-slate-200" />

      {/* About body */}
      <div className="mt-6 flex-1 space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 sm:text-xs">
            <span className="h-1 w-1 rounded-full bg-slate-900" />
            عن المشروع
          </div>
          <h2 className="mt-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            ما هو المشروع باختصار
          </h2>
        </div>

        <p className="text-sm leading-loose text-slate-700 sm:text-base">
          منصة داخلية متكاملة تُدار من فريق محدد مسبقًا — تُنتج نوعين من المحتوى بشكل
          آلي:
        </p>

        <ol className="space-y-2.5">
          <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
              ١
            </span>
            <span className="text-sm leading-relaxed text-slate-700 sm:text-base">
              <span className="font-semibold text-slate-900">كتابة المقالات</span>{" "}
              عالية الجودة مُهيأة للسيو.
            </span>
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
              ٢
            </span>
            <span className="text-sm leading-relaxed text-slate-700 sm:text-base">
              <span className="font-semibold text-slate-900">تحسين المنتجات</span> —
              إعادة هيكلة وكتابة المنتج بشكل احترافي مطابق لمواصفات السيو، فقط من
              رابط المنتج.
            </span>
          </li>
        </ol>

        <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
          <MiniPill icon={Sparkles} text="توليد ذكي بالذكاء الاصطناعي" />
          <MiniPill icon={Layers} text="قابل للتوسعة مستقبلًا" />
          <MiniPill icon={Globe} text="عربي بالكامل" />
          <MiniPill icon={ShieldCheck} text="حماية متعددة الطبقات" />
        </div>
      </div>
    </div>
  );
}

function FeaturesPage() {
  const others: { icon: LucideIcon; title: string; desc: string }[] = [
    {
      icon: BarChart3,
      title: "إحصائيات وفلاتر",
      desc: "لوحة متابعة مع فلاتر التاريخ والكاتب والبحث السريع.",
    },
    {
      icon: Edit3,
      title: "محرر نصوص احترافي",
      desc: "تنسيقات متعددة مع حفظ تلقائي أثناء الكتابة.",
    },
    {
      icon: Users,
      title: "إدارة الأدوار",
      desc: "نظام أدوار ثنائي (أدمن / موظف) بصلاحيات دقيقة.",
    },
    {
      icon: ShieldCheck,
      title: "حماية متعددة الطبقات",
      desc: "ثلاث طبقات حماية متعاقبة على مستوى الشبكة والبيانات.",
    },
  ];

  return (
    <PageShell eyebrow="المميزات" title="ماذا ستحصل عليه شركة مكاسب">
      <div className="book-stagger space-y-5">
        {/* Core: content generation system */}
        <div>
          {/* Parent pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm sm:text-base">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              نظام إنشاء مقالات
            </div>
          </div>

          {/* Connectors */}
          <div className="flex justify-center">
            <svg
              width="260"
              height="36"
              viewBox="0 0 260 36"
              className="hidden sm:block"
              aria-hidden
            >
              <path
                d="M 130 0 L 130 14 M 40 22 L 220 22 M 40 22 L 40 36 M 220 22 L 220 36"
                stroke="#cbd5e1"
                strokeWidth="1.25"
                fill="none"
              />
            </svg>
            <div className="mx-auto h-4 w-px bg-slate-300 sm:hidden" />
          </div>

          {/* Branches */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BranchCard
              icon={FileText}
              title="مقال معلوماتي"
              desc="مقالات شاملة بأي موضوع، مُهيأة للسيو وجاهزة للنشر على المدونات والمواقع."
            />
            <BranchCard
              icon={ShoppingBag}
              title="مقال منتج"
              desc="صفحات منتجات احترافية محسّنة بالكامل، انطلاقًا من رابط المنتج فقط."
            />
          </div>
        </div>

        {/* Second system: product enhancement */}
        <div>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm sm:text-base">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              نظام تحسين منتجات
            </div>
          </div>
          <div className="mx-auto my-2 h-4 w-px bg-slate-300" />
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
              إعادة هيكلة محتوى المنتج وصياغته احترافيًا بمعايير السيو، لرفع ظهور
              الصفحة وجودتها التسويقية.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-medium tracking-wider text-slate-400 sm:text-xs">
            مميزات إضافية
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Other features */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {others.map((f) => (
            <div
              key={f.title}
              className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300 sm:p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                <f.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function BranchCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <Icon className="h-5 w-5 text-slate-900" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h3>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">{desc}</p>
    </div>
  );
}

function PipelinePage() {
  const stages: { n: string; icon: LucideIcon; title: string; desc: string }[] = [
    {
      n: "١",
      icon: ScanLine,
      title: "تحليل المنتج أو الموضوع",
      desc: "جمع معلومات كاملة ودقيقة وفهم السياق والجمهور المستهدف.",
    },
    {
      n: "٢",
      icon: Search,
      title: "البحث عن الكلمات المفتاحية",
      desc: "تحديد أقوى الكلمات مع دراسة حجم البحث والمنافسة.",
    },
    {
      n: "٣",
      icon: MessageCircleQuestion,
      title: "استخراج الأسئلة الشائعة",
      desc: "جمع أبرز ما يطرحه الجمهور لتضمينه داخل المحتوى.",
    },
    {
      n: "٤",
      icon: FileSearch,
      title: "البحث العميق",
      desc: "تجميع أكبر قدر ممكن من المعلومات الصحيحة للمنتج من مصادر موثوقة.",
    },
    {
      n: "٥",
      icon: LayoutTemplate,
      title: "الصياغة النهائية والتنسيق",
      desc: "تنسيق احترافي مع أساسيات السيو: ميتا تايتل، ميتا ديسكريبشن، الهيدرز، الروابط الداخلية.",
    },
  ];

  return (
    <PageShell
      eyebrow="كيف تعمل المنصة"
      title="المراحل الخمس لإنتاج المحتوى"
      subtitle="رحلة متكاملة من الفكرة إلى محتوى جاهز للنشر"
    >
      <div className="book-stagger space-y-3">
        {stages.map((s) => (
          <div
            key={s.n}
            className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-base font-bold text-white sm:h-12 sm:w-12 sm:text-lg">
              {s.n}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-slate-400">
                <s.icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wider sm:text-xs">
                  المرحلة
                </span>
              </div>
              <h3 className="mt-0.5 text-sm font-semibold text-slate-900 sm:text-base">
                {s.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function ToolsPage() {
  const tools: { name: string; icon: LucideIcon; role: string }[] = [
    {
      name: "OpenAI GPT-4o",
      icon: Brain,
      role: "نموذج الذكاء الاصطناعي الرئيسي لصياغة المحتوى وتحليل الصور.",
    },
    {
      name: "Perplexity AI",
      icon: FileSearch,
      role: "أداة بحث ذكية تجمع معلومات موثوقة من مصادر متعددة بسرعة ودقة.",
    },
    {
      name: "Supabase",
      icon: Database,
      role: "قاعدة البيانات ونظام المصادقة وإدارة الصلاحيات بشكل آمن.",
    },
    {
      name: "Next.js",
      icon: Code2,
      role: "إطار العمل الذي تُبنى عليه الواجهة والخادم لأداء سريع.",
    },
    {
      name: "TipTap",
      icon: Edit3,
      role: "محرك المحرر الغني داخل المنصة يدعم التنسيقات الاحترافية.",
    },
  ];

  return (
    <PageShell
      eyebrow="الأدوات المشهورة"
      title="أبرز الأدوات المستخدمة"
      subtitle="مجموعة من أقوى الأدوات العالمية مدمجة معًا"
    >
      <div className="book-stagger grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                <t.icon className="h-5 w-5 text-slate-900" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                {t.name}
              </h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {t.role}
            </p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function WorkflowsPage() {
  const articleSteps: { icon: LucideIcon; label: string }[] = [
    { icon: Sparkles, label: "موضوع المقال" },
    { icon: ScanLine, label: "تحليل الموضوع" },
    { icon: Search, label: "كلمات مفتاحية" },
    { icon: MessageCircleQuestion, label: "أسئلة الجمهور" },
    { icon: FileSearch, label: "بحث عميق" },
    { icon: LayoutTemplate, label: "صياغة + سيو" },
    { icon: FileText, label: "مقال جاهز" },
  ];

  const productSteps: { icon: LucideIcon; label: string }[] = [
    { icon: Link2, label: "رابط المنتج" },
    { icon: ScanLine, label: "استخراج البيانات" },
    { icon: ImageIcon, label: "استخراج صور المنتج" },
    { icon: Eye, label: "تحليل بصري" },
    { icon: Search, label: "كلمات مفتاحية" },
    { icon: LayoutTemplate, label: "صياغة + سيو" },
    { icon: ShoppingBag, label: "صفحة محسّنة" },
  ];

  return (
    <PageShell
      eyebrow="مسارات العمل"
      title="كيف يتدفق العمل داخل المنصة"
      subtitle="تصور بصري مبسط للمسارين الأساسيين"
    >
      <div className="book-stagger space-y-6">
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
            <FileText className="h-4 w-4" />
            مسار إنتاج المقالات
          </h3>
          <WorkflowDiagram steps={articleSteps} />
        </section>

        <div className="h-px w-full bg-slate-200" />

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
            <ShoppingBag className="h-4 w-4" />
            مسار تحسين المنتجات
          </h3>
          <WorkflowDiagram steps={productSteps} />
        </section>
      </div>
    </PageShell>
  );
}

function WorkflowDiagram({
  steps,
}: {
  steps: { icon: LucideIcon; label: string }[];
}) {
  return (
    <div className="book-stagger flex flex-wrap items-start justify-center gap-y-5">
      {steps.map((step, idx) => {
        const last = idx === steps.length - 1;
        return (
          <div
            key={idx}
            className="flex w-1/2 items-start justify-center gap-1 sm:w-auto"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white sm:h-16 sm:w-16">
                <step.icon className="h-5 w-5 text-slate-900 sm:h-6 sm:w-6" />
              </div>
              <span className="max-w-[6.5rem] text-[11px] leading-snug text-slate-600 sm:max-w-[7rem] sm:text-xs">
                {step.label}
              </span>
            </div>
            {!last && (
              <div className="flex h-14 items-center text-slate-300 sm:h-16">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FuturePage() {
  return (
    <PageShell
      eyebrow="المستقبل"
      title="قابلية تطوير المنصة"
      subtitle="كل شيء مصمم ليكون قابلًا للتوسعة مع الوقت"
    >
      <div className="book-stagger space-y-5">
        <p className="text-sm leading-loose text-slate-700 sm:text-base md:text-lg">
          تم تصميم المنصة من الأساس بشكل مرن يسمح بإضافة العديد من الفيتشرات والتحسينات
          الجديدة عليها مستقبلًا، دون أي حاجة لإعادة بناء المشروع أو المساس بهيكله
          الأساسي.
        </p>

        <p className="text-sm leading-loose text-slate-600 sm:text-base">
          وضمن خطة التطوير المستمر، يمكن إدراج إضافات متنوعة تُحسّن من عمليات السيو
          بشكل عام — سواء على مستوى جودة المحتوى، أو على مستوى التحليل والمتابعة، أو
          على مستوى التكامل مع الأنظمة والأدوات الخارجية — بما يتناسب مع أولويات
          الشركة واحتياجاتها الفعلية.
        </p>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-slate-900" />
          <span className="text-sm leading-relaxed text-slate-700">
            كل إضافة يتم تنفيذها بتكلفة مستقلة ومتفق عليها مسبقًا حسب حجم العمل.
          </span>
        </div>
      </div>
    </PageShell>
  );
}

/* ============== Shared layout primitives ============== */

function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 sm:text-xs">
          <span className="h-1 w-1 rounded-full bg-slate-900" />
          {eyebrow}
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function MiniPill({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white">
        <Icon className="h-4 w-4 text-slate-900" />
      </div>
      <span className="text-sm font-medium text-slate-700">{text}</span>
    </div>
  );
}

/* ============== Book shell ============== */

type PageDef = {
  id: string;
  label: string;
  render: () => React.ReactNode;
};

const PAGES: PageDef[] = [
  { id: "intro", label: "المقدمة", render: () => <IntroPage /> },
  { id: "features", label: "المميزات", render: () => <FeaturesPage /> },
  { id: "pipeline", label: "مراحل العمل", render: () => <PipelinePage /> },
  { id: "tools", label: "الأدوات", render: () => <ToolsPage /> },
  {
    id: "workflows",
    label: "مسارات العمل",
    render: () => <WorkflowsPage />,
  },
  { id: "future", label: "قابلية التطوير", render: () => <FuturePage /> },
];

export function IntroductionBook() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const isAnimating = useRef(false);

  const total = PAGES.length;
  const current = PAGES[index];
  const progress = ((index + 1) / total) * 100;

  const navigate = useCallback(
    (target: number) => {
      if (isAnimating.current) return;
      const clamped = Math.max(0, Math.min(total - 1, target));
      if (clamped === index) return;
      setDirection(clamped > index ? "next" : "prev");
      setIndex(clamped);
      isAnimating.current = true;
      window.setTimeout(() => {
        isAnimating.current = false;
      }, 650);
    },
    [index, total]
  );

  const next = useCallback(() => navigate(index + 1), [index, navigate]);
  const prev = useCallback(() => navigate(index - 1), [index, navigate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        navigate(0);
      } else if (e.key === "End") {
        e.preventDefault();
        navigate(total - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, navigate, total]);

  function handleTouchStart(e: ReactTouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(e: ReactTouchEvent<HTMLDivElement>) {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }

  function handleTouchEnd() {
    if (touchStartX.current == null) return;
    const delta = touchDeltaX.current;
    const threshold = 60;
    if (delta > threshold) prev();
    else if (delta < -threshold) next();
    touchStartX.current = null;
    touchDeltaX.current = 0;
  }

  const pageClass = direction === "next" ? "book-page-next" : "book-page-prev";

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* decorative blobs matching the login page identity */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-slate-200 via-slate-100 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-tl from-sky-100 via-sky-50 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10 md:px-8 md:py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
              <span className="text-sm font-bold text-white">م</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">منصة محتوى</div>
              <div className="text-[11px] text-slate-500">
                عرض تقديمي — شركة مكاسب
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            <span className="text-slate-900">{toArabic(index + 1)}</span>
            <span className="text-slate-300">/</span>
            <span>{toArabic(total)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Book stage */}
        <div
          className="relative mt-6 flex-1"
          style={{ perspective: "2000px" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            key={current.id}
            className={cn(
              "relative flex min-h-[540px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/[0.04] sm:min-h-[560px] sm:p-8 md:min-h-[600px] md:p-10",
              pageClass
            )}
          >
            {/* subtle sheen across the new page */}
            <div className="book-sheen absolute inset-0 overflow-hidden rounded-3xl" />

            {/* page number in the corner */}
            <span className="absolute bottom-4 left-5 text-[10px] font-medium tracking-wider text-slate-300 sm:bottom-5 sm:left-7 sm:text-xs">
              — {toArabic(index + 1)} —
            </span>

            {/* content */}
            <div className="relative flex h-full min-h-0 flex-1 flex-col">
              {current.render()}
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="mt-6 flex flex-col items-center gap-4">
          {/* dots */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {PAGES.map((p, i) => {
              const active = i === index;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(i)}
                  aria-label={`الانتقال إلى ${p.label}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    active
                      ? "w-8 bg-slate-900"
                      : "w-1.5 bg-slate-300 hover:bg-slate-400"
                  )}
                />
              );
            })}
          </div>

          {/* arrows */}
          <div className="flex w-full items-center justify-between gap-3 sm:justify-center sm:gap-4">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              className={cn(
                "group inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all",
                "hover:border-slate-900 hover:bg-slate-900 hover:text-white",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700"
              )}
            >
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0" />
              السابق
            </button>

            <div className="hidden min-w-[8rem] text-center text-xs text-slate-500 sm:block">
              {current.label}
            </div>

            <button
              type="button"
              onClick={next}
              disabled={index === total - 1}
              className={cn(
                "group inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white transition-all",
                "hover:bg-slate-800",
                "disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              التالي
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 group-disabled:translate-x-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============== Utilities ============== */

function toArabic(num: number) {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((d) => arabicDigits[Number(d)] ?? d)
    .join("");
}
