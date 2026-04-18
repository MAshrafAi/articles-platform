import type { JSONContent } from "@tiptap/react";

export type ProductStatus = "generating" | "ready" | "error";

export interface ProductAuthor {
  id: string;
  full_name: string | null;
  email: string;
}

export interface ProductListItem {
  id: string;
  title: string | null;
  product_url: string | null;
  keyword: string | null;
  status: ProductStatus;
  created_at: string;
  author: ProductAuthor;
}

export interface ProductFull extends ProductListItem {
  content: JSONContent;
  updated_at: string;
}

export const PRODUCT_ENHANCE_STEPS = ["scraping", "vision", "writing", "seo"];

export const PRODUCT_STEP_LABELS: Record<string, string> = {
  scraping: "استخراج بيانات المنتج",
  vision: "تحليل صورة المنتج",
  writing: "كتابة وصف المنتج",
  seo: "إعداد بيانات SEO",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  ready: "مكتمل",
  generating: "جاري العمل",
  error: "فشل",
};

export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export interface ProductLogItem {
  id: string;
  title: string | null;
  status: ProductStatus;
  pipeline_logs: { step: string; status: string; at?: string; error?: string }[];
  created_at: string;
  author: ProductAuthor;
}
