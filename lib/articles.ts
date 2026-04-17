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
