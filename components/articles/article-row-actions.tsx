"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteArticleAction } from "@/app/(protected)/articles/actions";

interface ArticleRowActionsProps {
  articleId: string;
  articleTitle: string;
  variant?: "menu" | "button";
  redirectAfterDelete?: boolean;
}

export function ArticleRowActions({
  articleId,
  articleTitle,
  variant = "menu",
  redirectAfterDelete = false,
}: ArticleRowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteArticleAction({ articleId });
      if (result.ok) {
        toast.success("تم حذف المقال");
        setOpen(false);
        if (redirectAfterDelete) {
          router.push("/articles");
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      {variant === "menu" ? (
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="قائمة الأوامر"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => router.push(`/articles/${articleId}`)}
            >
              <Pencil className="ms-2 h-4 w-4" />
              تعديل المقال
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setOpen(true)}
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <Trash2 className="ms-2 h-4 w-4" />
              حذف المقال
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          حذف المقال
        </button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => !pending && setOpen(next)}
      >
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>تأكيد حذف المقال</DialogTitle>
            <DialogDescription>
              سيتم حذف{" "}
              <span className="font-medium text-slate-700">{articleTitle}</span>{" "}
              نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              تأكيد الحذف
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
