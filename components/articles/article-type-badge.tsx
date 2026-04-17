import { ARTICLE_TYPE_LABEL, type ArticleType } from "@/lib/articles";
import { cn } from "@/lib/utils";

interface ArticleTypeBadgeProps {
  type: ArticleType;
  className?: string;
}

export function ArticleTypeBadge({ type, className }: ArticleTypeBadgeProps) {
  const styles =
    type === "product"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : "bg-violet-50 text-violet-700 ring-violet-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles,
        className
      )}
    >
      {ARTICLE_TYPE_LABEL[type]}
    </span>
  );
}
