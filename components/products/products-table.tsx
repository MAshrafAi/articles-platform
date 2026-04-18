"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ShoppingBag, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
                    <DeleteButton
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

function DeleteButton({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`هل تريد حذف "${productTitle}"؟`)) return;
    startTransition(async () => {
      const result = await deleteProductAction({ productId });
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      title="حذف"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
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
