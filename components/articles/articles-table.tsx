import Link from "next/link";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArticleTypeBadge } from "@/components/articles/article-type-badge";
import { ArticleRowActions } from "@/components/articles/article-row-actions";
import { formatDate } from "@/lib/formatters";
import type { ArticleListItem } from "@/lib/articles";
import type { UserRole } from "@/lib/auth";

interface ArticlesTableProps {
  articles: ArticleListItem[];
  currentUserId: string;
  currentRole: UserRole;
}

export function ArticlesTable({
  articles,
  currentUserId,
  currentRole,
}: ArticlesTableProps) {
  if (articles.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="text-start text-slate-600">العنوان</TableHead>
            <TableHead className="text-start text-slate-600">النوع</TableHead>
            <TableHead className="text-start text-slate-600">الناشر</TableHead>
            <TableHead className="text-start text-slate-600">تاريخ الإنشاء</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => {
            const isSelf = article.author.id === currentUserId;
            const canDelete = isSelf || currentRole === "admin";
            const displayTitle = article.title?.trim() || "مقال بدون عنوان";
            const authorName =
              article.author.full_name?.trim() || article.author.email;

            return (
              <TableRow key={article.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium">
                  <Link
                    href={`/articles/${article.id}`}
                    className="text-slate-900 transition-colors hover:text-slate-600"
                  >
                    <span
                      className={
                        article.title ? "" : "italic text-slate-400"
                      }
                    >
                      {displayTitle}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <ArticleTypeBadge type={article.type} />
                </TableCell>
                <TableCell className="text-slate-600">
                  {authorName}
                  {isSelf && (
                    <span className="mr-2 text-xs font-normal text-slate-400">
                      (أنت)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-slate-600">
                  {formatDate(article.created_at)}
                </TableCell>
                <TableCell>
                  {canDelete && (
                    <ArticleRowActions
                      articleId={article.id}
                      articleTitle={displayTitle}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <FileText className="h-8 w-8 text-slate-400" />
      </div>
      <div className="max-w-sm">
        <h3 className="text-base font-semibold text-slate-900">
          لا يوجد مقالات بعد
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          ابدأ بإنشاء أول مقال — اضغط على زر "إنشاء مقال" أعلى الصفحة لاختيار نوع المقال.
        </p>
      </div>
    </div>
  );
}
