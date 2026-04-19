"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, CalendarDays, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  PRESET_LABELS,
  formatRangeLabel,
  type DateRangePreset,
} from "@/lib/date-range";
import type { DateRange as RDPDateRange } from "react-day-picker";

interface AuthorOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface ArticlesFiltersProps {
  showAuthorFilter: boolean;
  authorsList: AuthorOption[];
}

const PRESETS: DateRangePreset[] = ["all", "today", "week", "month", "year", "custom"];

export function ArticlesFilters({ showAuthorFilter, authorsList }: ArticlesFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentPreset = (searchParams.get("preset") ?? "all") as DateRangePreset;
  const currentFrom = searchParams.get("from");
  const currentTo = searchParams.get("to");
  const currentQuery = searchParams.get("q") ?? "";
  const currentAuthor = searchParams.get("author") ?? "all";
  const currentSort = (searchParams.get("sort") ?? "desc") as "asc" | "desc";

  const [query, setQuery] = useState(currentQuery);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

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

  const handlePreset = (preset: DateRangePreset) => {
    if (preset === "custom") {
      updateParams({ preset: "custom" });
    } else {
      updateParams({ preset, from: null, to: null });
      setDatePopoverOpen(false);
    }
  };

  const handleCustomRange = (range: RDPDateRange | undefined) => {
    if (!range) return;
    updateParams({
      preset: "custom",
      from: range.from ? range.from.toISOString() : null,
      to: range.to ? range.to.toISOString() : null,
    });
  };

  const handleAuthor = (value: string) => {
    updateParams({ author: value === "all" ? null : value });
  };

  const handleSortToggle = () => {
    updateParams({ sort: currentSort === "desc" ? "asc" : "desc" });
  };

  const dateLabel = useMemo(() => {
    const from = currentFrom ? new Date(currentFrom) : null;
    const to = currentTo ? new Date(currentTo) : null;
    return formatRangeLabel({ from, to }, currentPreset);
  }, [currentFrom, currentTo, currentPreset]);

  const calendarRange: RDPDateRange | undefined = useMemo(() => {
    const from = currentFrom ? new Date(currentFrom) : undefined;
    const to = currentTo ? new Date(currentTo) : undefined;
    if (!from && !to) return undefined;
    return { from, to };
  }, [currentFrom, currentTo]);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {/* Date range */}
      <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <span>{dateLabel}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" dir="rtl" className="w-auto p-0">
          <div className="flex flex-col gap-1 border-b border-slate-100 p-2">
            {PRESETS.map((p) => {
              const active = p === currentPreset;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span>{PRESET_LABELS[p]}</span>
                  {active && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          {currentPreset === "custom" && (
            <div className="p-2">
              <Calendar
                mode="range"
                dir="rtl"
                selected={calendarRange}
                onSelect={handleCustomRange}
                numberOfMonths={1}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Search */}
      <div className="relative w-full flex-1 sm:w-auto sm:min-w-[220px]">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بعنوان المقال…"
          className="h-10 pr-9"
        />
      </div>

      {/* Author filter (admin only) */}
      {showAuthorFilter && (
        <Select value={currentAuthor} onValueChange={handleAuthor}>
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
        onClick={handleSortToggle}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        title={currentSort === "desc" ? "الأحدث أولاً" : "الأقدم أولاً"}
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
