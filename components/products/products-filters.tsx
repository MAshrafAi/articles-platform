"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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

interface ProductsFiltersProps {
  showAuthorFilter: boolean;
  authorsList: AuthorOption[];
}

export function ProductsFilters({ showAuthorFilter, authorsList }: ProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") ?? "";
  const currentAuthor = searchParams.get("author") ?? "all";
  const currentSort = (searchParams.get("sort") ?? "desc") as "asc" | "desc";

  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      startTransition(() => {
        router.replace(`?${next.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === currentQuery) return;
    const handle = setTimeout(() => {
      updateParams({ q: trimmed || null });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative w-full flex-1 sm:w-auto sm:min-w-[220px]">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بعنوان المنتج…"
          className="h-10 pr-9"
        />
      </div>

      {/* Author filter (admin only) */}
      {showAuthorFilter && (
        <Select value={currentAuthor} onValueChange={(v) => updateParams({ author: v === "all" ? null : v })}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
            <SelectValue placeholder="الناشر" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="all">كل الناشرين</SelectItem>
            {authorsList.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.full_name || a.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sort toggle */}
      <button
        type="button"
        onClick={() => updateParams({ sort: currentSort === "desc" ? "asc" : "desc" })}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        {currentSort === "desc" ? (
          <ArrowDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ArrowUp className="h-4 w-4 text-slate-500" />
        )}
        <span>{currentSort === "desc" ? "الأحدث أولاً" : "الأقدم أولاً"}</span>
      </button>
    </div>
  );
}
