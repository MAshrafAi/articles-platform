"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { ArrowDownUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuthorOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface LogsFiltersProps {
  authorsList: AuthorOption[];
}

export function LogsFilters({ authorsList }: LogsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const currentSort = searchParams.get("sort") ?? "desc";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) =>
          updateParams({ status: v === "all" ? null : v })
        }
      >
        <SelectTrigger dir="rtl" className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent dir="rtl">
          <SelectItem value="all">كل الحالات</SelectItem>
          <SelectItem value="ready">مكتمل</SelectItem>
          <SelectItem value="generating">جاري العمل</SelectItem>
          <SelectItem value="error">فشل</SelectItem>
        </SelectContent>
      </Select>

      {/* Type filter */}
      <Select
        value={searchParams.get("type") ?? "all"}
        onValueChange={(v) =>
          updateParams({ type: v === "all" ? null : v })
        }
      >
        <SelectTrigger dir="rtl" className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent dir="rtl">
          <SelectItem value="all">كل الأنواع</SelectItem>
          <SelectItem value="informational">مقال معلوماتي</SelectItem>
          <SelectItem value="product">مقال منتج</SelectItem>
        </SelectContent>
      </Select>

      {/* Author filter */}
      <Select
        value={searchParams.get("author") ?? "all"}
        onValueChange={(v) =>
          updateParams({ author: v === "all" ? null : v })
        }
      >
        <SelectTrigger dir="rtl" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent dir="rtl">
          <SelectItem value="all">كل الناشرين</SelectItem>
          {authorsList.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.full_name?.trim() || a.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort toggle */}
      <button
        type="button"
        onClick={() =>
          updateParams({ sort: currentSort === "desc" ? "asc" : "desc" })
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
      >
        <ArrowDownUp className="h-3.5 w-3.5" />
        {currentSort === "desc" ? "الأحدث أولاً" : "الأقدم أولاً"}
      </button>
    </div>
  );
}
