"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/formatters";
import { ArticleTypeBadge } from "@/components/articles/article-type-badge";
import type {
  ArticleLogItem,
  PipelineLogEntry,
} from "@/lib/articles";
import {
  STEP_LABELS,
  STATUS_LABELS,
  INFORMATIONAL_STEPS,
  PRODUCT_STEPS,
} from "@/lib/articles";

interface LogsTableProps {
  articles: ArticleLogItem[];
}

export function LogsTable({ articles }: LogsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-slate-500">لا توجد مقالات لعرضها</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="px-4 py-3 text-start text-xs font-medium text-slate-500">
              عنوان المقال
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-slate-500">
              الحالة
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-slate-500">
              النوع
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-slate-500">
              الناشر
            </th>
            <th className="px-4 py-3 text-start text-xs font-medium text-slate-500">
              التاريخ
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => {
            const isExpanded = expandedId === article.id;
            return (
              <LogRow
                key={article.id}
                article={article}
                isExpanded={isExpanded}
                onToggle={() =>
                  setExpandedId(isExpanded ? null : article.id)
                }
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Single row ──────────────────────────────────────────────────────────────

function LogRow({
  article,
  isExpanded,
  onToggle,
}: {
  article: ArticleLogItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const authorName =
    article.author.full_name?.trim() || article.author.email;

  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50",
          isExpanded && "bg-slate-50"
        )}
      >
        <td className="px-4 py-3 font-medium text-slate-900">
          {article.title || "بدون عنوان"}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={article.status} />
        </td>
        <td className="px-4 py-3">
          <ArticleTypeBadge type={article.type} />
        </td>
        <td className="px-4 py-3 text-slate-600">{authorName}</td>
        <td className="px-4 py-3 text-slate-500">
          {formatDateTime(article.created_at)}
        </td>
        <td className="px-4 py-3">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-slate-50/50 px-6 py-4">
            <PipelineTimeline
              logs={article.pipeline_logs}
              articleType={article.type}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    ready: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    generating: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
    },
  };

  const c = config[status] ?? config.error;
  const label =
    STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        c.bg,
        c.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {label}
    </span>
  );
}

// ─── Pipeline timeline ───────────────────────────────────────────────────────

function PipelineTimeline({
  logs,
  articleType,
}: {
  logs: PipelineLogEntry[];
  articleType: string;
}) {
  const expectedSteps =
    articleType === "product" ? PRODUCT_STEPS : INFORMATIONAL_STEPS;

  // Build a map of step → log entry
  const logMap = new Map<string, PipelineLogEntry>();
  for (const entry of logs) {
    logMap.set(entry.step, entry);
  }

  return (
    <div className="space-y-0">
      <p className="mb-3 text-xs font-medium text-slate-500">مراحل سير العمل</p>
      <div className="space-y-0">
        {expectedSteps.map((stepKey, index) => {
          const entry = logMap.get(stepKey);
          const isLast = index === expectedSteps.length - 1;
          return (
            <StepRow
              key={stepKey}
              stepKey={stepKey}
              entry={entry}
              isLast={isLast}
            />
          );
        })}
      </div>
    </div>
  );
}

function StepRow({
  stepKey,
  entry,
  isLast,
}: {
  stepKey: string;
  entry?: PipelineLogEntry;
  isLast: boolean;
}) {
  const label = STEP_LABELS[stepKey] ?? stepKey;
  const status = entry?.status ?? "pending";

  const timeStr = entry?.at
    ? new Date(entry.at).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "—";

  const handleCopyError = () => {
    if (entry?.error) {
      navigator.clipboard.writeText(entry.error);
      toast.success("تم نسخ رسالة الخطأ");
    }
  };

  return (
    <div className="flex items-start gap-3">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center">
        <StepIcon status={status} />
        {!isLast && (
          <div
            className={cn(
              "w-px flex-1 min-h-[24px]",
              status === "completed"
                ? "bg-emerald-200"
                : status === "failed"
                  ? "bg-red-200"
                  : "bg-slate-200"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-medium",
              status === "completed" && "text-slate-900",
              status === "failed" && "text-red-700",
              status === "pending" && "text-slate-400"
            )}
          >
            {label}
          </span>
          <span className="text-xs tabular-nums text-slate-400">{timeStr}</span>
        </div>

        {/* Error message */}
        {status === "failed" && entry?.error && (
          <div className="mt-1.5 flex items-start gap-2">
            <p
              className="flex-1 truncate text-xs text-red-500"
              title={entry.error}
            >
              {entry.error.length > 80
                ? entry.error.slice(0, 80) + "…"
                : entry.error}
            </p>
            <button
              type="button"
              onClick={handleCopyError}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <Copy className="h-3 w-3" />
              نسخ الخطأ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIcon({ status }: { status: string }) {
  if (status === "completed") {
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />;
  }
  if (status === "failed") {
    return <XCircle className="h-5 w-5 shrink-0 text-red-500" />;
  }
  return <Clock className="h-5 w-5 shrink-0 text-slate-300" />;
}
