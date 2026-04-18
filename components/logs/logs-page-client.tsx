"use client";

import { useState } from "react";
import { FileText, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArticleLogItem } from "@/lib/articles";
import type { ProductLogItem } from "@/lib/products";
import { LogsFilters } from "@/components/logs/logs-filters";
import { LogsTable } from "@/components/logs/logs-table";
import { ProductLogsTable } from "@/components/logs/product-logs-table";

type Tab = "articles" | "products";

interface LogsPageClientProps {
  articles: ArticleLogItem[];
  products: ProductLogItem[];
  authorsList: { id: string; full_name: string | null; email: string }[];
}

export function LogsPageClient({
  articles,
  products,
  authorsList,
}: LogsPageClientProps) {
  const [tab, setTab] = useState<Tab>("articles");

  return (
    <>
      {/* Tab switch */}
      <div className="mb-6 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
        <TabButton
          active={tab === "articles"}
          onClick={() => setTab("articles")}
          icon={<FileText className="h-4 w-4" />}
          label="المقالات"
          count={articles.length}
        />
        <TabButton
          active={tab === "products"}
          onClick={() => setTab("products")}
          icon={<ShoppingBag className="h-4 w-4" />}
          label="المنتجات"
          count={products.length}
        />
      </div>

      <LogsFilters authorsList={authorsList} showTypeFilter={tab === "articles"} />

      {tab === "articles" ? (
        <LogsTable articles={articles} />
      ) : (
        <ProductLogsTable products={products} />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs tabular-nums",
          active
            ? "bg-slate-100 text-slate-700"
            : "bg-transparent text-slate-400"
        )}
      >
        {count}
      </span>
    </button>
  );
}
