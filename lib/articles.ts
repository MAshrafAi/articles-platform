import type { JSONContent } from "@tiptap/react";

export type ArticleType = "product" | "informational";

export type ArticleStatus = "generating" | "ready" | "error";

export interface ArticleAuthor {
  id: string;
  full_name: string | null;
  email: string;
}

export interface ArticleListItem {
  id: string;
  title: string | null;
  type: ArticleType;
  status: ArticleStatus;
  created_at: string;
  author: ArticleAuthor;
}

export interface ArticleFull extends ArticleListItem {
  content: JSONContent;
  updated_at: string;
}

export const ARTICLE_TYPE_LABEL: Record<ArticleType, string> = {
  product: "مقال منتج",
  informational: "مقال معلوماتي",
};

export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

// ─── Pipeline logs ──────────────────────────────────────────────────────────

export type PipelineStepStatus = "completed" | "failed" | "pending";

export interface PipelineLogEntry {
  step: string;
  status: PipelineStepStatus;
  at?: string;
  error?: string;
}

export const STEP_LABELS: Record<string, string> = {
  product_extraction: "استخراج المنتجات",
  research: "البحث وجمع المعلومات",
  paa: "تجميع الأسئلة الشائعة",
  outline: "إعداد المخطط",
  writing: "كتابة المقال",
};

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  ready: "مكتمل",
  generating: "جاري العمل",
  error: "فشل",
};

export const INFORMATIONAL_STEPS = ["research", "paa", "outline", "writing"];
export const PRODUCT_STEPS = ["product_extraction", "research", "paa", "outline", "writing"];

export interface ArticleLogItem {
  id: string;
  title: string | null;
  type: ArticleType;
  status: ArticleStatus;
  pipeline_logs: PipelineLogEntry[];
  created_at: string;
  author: ArticleAuthor;
}
