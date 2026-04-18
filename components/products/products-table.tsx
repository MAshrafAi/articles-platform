"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShoppingBag, Loader2, AlertCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { formatDate } from "@/lib/formatters";
import type { ProductListItem } from "@/lib/products";
import type { UserRole } from "@/lib/auth";
import { deleteProductAction } from "@/app/(protected)/products/actions";

interface ProductsTableProps {
  products: ProductListItem[];
  currentUserId: string;
  currentRole: UserRole;
}

export function ProductsTable({
  products,
  currentUserId,
  currentRole,
}: ProductsTableProps) {
  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="text-start text-slate-600">العنوان</TableHead>
            <TableHead className="text-start text-slate-600">الكلمة المفتاحية</TableHead>
            <TableHead className="text-start text-slate-600">الناشر</TableHead>
            <TableHead className="text-start text-slate-600">التاريخ</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isSelf = product.author.id === currentUserId;
            const canDelete = isSelf || currentRole === "admin";
            const displayTitle = product.title?.trim() || "منتج بدون عنوان";
            const authorName =
              product.author.full_name?.trim() || product.author.email;
            const isGenerating = product.status === "generating";
            const isError = product.status === "error";

            return (
              <TableRow key={product.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium">
                  {isGenerating ? (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="italic">{displayTitle}</span>
                    </span>
                  ) : isError ? (
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                      <Link
                        href={`/products/${product.id}`}
                        className="text-slate-900 transition-colors hover:text-slate-600"
                      >
                        <span className={product.title ? "" : "italic text-slate-400"}>
                          {displayTitle}
                        </span>
                      </Link>
                    </span>
                  ) : (
                    <Link
                      href={`/products/${product.id}`}
                      className="text-slate-900 transition-colors hover:text-slate-600"
                    >
                      <span className={product.title ? "" : "italic text-slate-400"}>
                        {displayTitle}
                      </span>
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-slate-600">
                  {product.keyword || "—"}
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
                  {formatDate(product.created_at)}
                </TableCell>
                <TableCell>
                  {canDelete && (
                    <ProductRowActions
                      productId={product.id}
                      productTitle={displayTitle}
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

function ProductRowActions({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProductAction({ productId });
      if (result.ok) {
        toast.success("تم حذف المنتج");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
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
            onClick={() => router.push(`/products/${productId}`)}
          >
            <Pencil className="ms-2 h-4 w-4" />
            تعديل المنتج
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <Trash2 className="ms-2 h-4 w-4" />
            حذف المنتج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={open}
        onOpenChange={(next) => !pending && setOpen(next)}
      >
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>تأكيد حذف المنتج</DialogTitle>
            <DialogDescription>
              سيتم حذف{" "}
              <span className="font-medium text-slate-700">{productTitle}</span>{" "}
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <ShoppingBag className="h-8 w-8 text-slate-400" />
      </div>
      <div className="max-w-sm">
        <h3 className="text-base font-semibold text-slate-900">
          لا يوجد منتجات بعد
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          ابدأ بإضافة أول منتج — اضغط على زر "تحسين منتج" أعلى الصفحة.
        </p>
      </div>
    </div>
  );
}
