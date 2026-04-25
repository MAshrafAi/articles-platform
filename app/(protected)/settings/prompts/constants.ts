export const PROMPT_KEYS = [
  "search_queries",
  "research_informational",
  "research_product",
  "outline",
  "writer_informational",
  "writer_product",
  "product_vision_article",
  "product_vision_description",
  "product_outline",
  "product_search_queries",
  "product_description",
  "product_seo",
] as const;

export type PromptKey = (typeof PROMPT_KEYS)[number];

export type WorkflowId =
  | "informational"
  | "product_article"
  | "product_description";

export type WorkflowStage = {
  key: PromptKey;
  label: string;
  description: string;
  model: string;
};

export type Workflow = {
  id: WorkflowId;
  label: string;
  stages: WorkflowStage[];
};

export const WORKFLOWS: Workflow[] = [
  {
    id: "informational",
    label: "مقال معلوماتي",
    stages: [
      {
        key: "search_queries",
        label: "تحليل الكلمة المفتاحية وتوليد برومبتات البحث",
        description:
          "بتحلل الكلمة المفتاحية مع عنوان المقال والملاحظات، وتحوّلهم إلى 3 برومبتات بحث عربية بزوايا مختلفة.",
        model: "gpt-5-chat-latest",
      },
      {
        key: "research_informational",
        label: "جمع بيانات البحث",
        description:
          "تستقبل برومبتات البحث الناتجة من المرحلة السابقة، وتستخدمها في Perplexity/Sonar لجمع معلومات ومصادر عن الموضوع.",
        model: "perplexity/sonar-pro",
      },
      {
        key: "outline",
        label: "إنشاء مخطط المقال",
        description:
          "تستقبل معلومات البحث من Sonar، ومعها الكلمة المفتاحية والعنوان والملاحظات، ثم تبني Outline كامل للمقال يحتوي على H2 و H3 ومعلومات كل سكشن.",
        model: "gpt-4.1",
      },
      {
        key: "writer_informational",
        label: "كتابة المقال",
        description:
          "تستقبل كل سكشن من الـ Outline الناتج من المرحلة السابقة، وتكتب محتوى السكشن بالعربي بناءً على الـ H2 والـ H3 والمعلومات المحددة.",
        model: "gpt-5-chat-latest",
      },
    ],
  },
  {
    id: "product_article",
    label: "مقال منتج",
    stages: [
      {
        key: "product_vision_article",
        label: "تحليل الصورة واستخراج مواصفات المنتج",
        description:
          "بتحلل صورة المنتج لاستخراج المواصفات الأساسية زي اللون، الخامة، التصميم، والاستخدام، مع تحويلها لوصف واضح يساعد العميل يفهم المنتج.",
        model: "gpt-4o",
      },
      {
        key: "product_search_queries",
        label: "تحليل الكلمة المفتاحية وتوليد برومبتات البحث",
        description:
          "بتحلل الكلمة المفتاحية مع عنوان المقال والملاحظات، وتحوّلهم إلى 3 برومبتات بحث عربية بزوايا مختلفة.",
        model: "gpt-5-chat-latest",
      },
      {
        key: "research_product",
        label: "جمع بيانات البحث",
        description:
          "تستقبل برومبتات البحث الناتجة من المرحلة السابقة، وتستخدمها في Perplexity/Sonar لجمع معلومات ومصادر عن الموضوع.",
        model: "perplexity/sonar-pro",
      },
      {
        key: "product_outline",
        label: "إنشاء مخطط المقال",
        description:
          "تستقبل معلومات البحث من Sonar، ومعها الكلمة المفتاحية والعنوان والملاحظات + بيانات المنتجات، ثم تبني Outline كامل للمقال يحتوي على H2 و H3 ومعلومات كل سكشن.",
        model: "gpt-4.1",
      },
      {
        key: "writer_product",
        label: "كتابة المقال",
        description:
          "تستقبل كل سكشن من الـ Outline الناتج من المرحلة السابقة، وتكتب محتوى السكشن بالعربي بناءً على الـ H2 والـ H3 والمعلومات المحددة.",
        model: "gpt-5-chat-latest",
      },
    ],
  },
  {
    id: "product_description",
    label: "تحسين منتج",
    stages: [
      {
        key: "product_vision_description",
        label: "تحليل الصورة واستخراج مواصفات المنتج",
        description:
          "بتحلل صورة المنتج لاستخراج المواصفات الأساسية زي اللون، الخامة، التصميم، والاستخدام، مع تحويلها لوصف واضح يساعد العميل يفهم المنتج.",
        model: "gpt-4o",
      },
      {
        key: "product_description",
        label: "كتابة وصف المنتج",
        description:
          "تستقبل بيانات المنتج (النص + المواصفات + الكلمة المفتاحية)، وتكتب وصف منتج احترافي متوافق مع SEO يشمل مقدمة + مواصفات + مميزات بشكل منظم.",
        model: "gpt-4.1",
      },
      {
        key: "product_seo",
        label: "تحسين السيو وكتابه المنتج المحسن (Meta + Tags + Alt Text)",
        description:
          "تستقبل وصف المنتج من المرحلة السابقة، وتولّد Meta Title (عدة نسخ) + Meta Description + Image Alt Text + Keyword Tags.",
        model: "gpt-4.1",
      },
    ],
  },
];
