import {
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  differenceInCalendarDays,
} from "date-fns";

export type DateRangePreset =
  | "all"
  | "today"
  | "week"
  | "month"
  | "year"
  | "custom";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export const DEFAULT_PRESET: DateRangePreset = "all";

export function presetToRange(preset: DateRangePreset, now: Date = new Date()): DateRange {
  switch (preset) {
    case "all":
      return { from: null, to: null };
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "custom":
      return { from: null, to: null };
  }
}

/**
 * Resolves a date range from URL searchParams.
 * Preset takes precedence. If preset is "custom", uses from/to ISO strings.
 */
export function resolveRange(params: {
  preset?: string;
  from?: string;
  to?: string;
}): { range: DateRange; preset: DateRangePreset } {
  const preset = (params.preset ?? DEFAULT_PRESET) as DateRangePreset;

  if (preset === "custom") {
    const from = params.from ? new Date(params.from) : null;
    const to = params.to ? new Date(params.to) : null;
    return { range: { from, to }, preset };
  }

  if (
    preset === "all" ||
    preset === "today" ||
    preset === "week" ||
    preset === "month" ||
    preset === "year"
  ) {
    return { range: presetToRange(preset), preset };
  }

  return { range: presetToRange("all"), preset: "all" };
}

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  all: "الكل",
  today: "اليوم",
  week: "آخر ٧ أيام",
  month: "هذا الشهر",
  year: "هذه السنة",
  custom: "مخصص",
};

const rangeFormatter = new Intl.DateTimeFormat("ar", {
  day: "numeric",
  month: "short",
});

export function formatRangeLabel(range: DateRange, preset: DateRangePreset): string {
  if (preset !== "custom") return PRESET_LABELS[preset];
  if (!range.from && !range.to) return "مخصص";
  if (range.from && range.to) {
    return `${rangeFormatter.format(range.from)} – ${rangeFormatter.format(range.to)}`;
  }
  if (range.from) return `من ${rangeFormatter.format(range.from)}`;
  if (range.to) return `حتى ${rangeFormatter.format(range.to)}`;
  return "مخصص";
}

/**
 * Returns the number of days in a range. If `from`/`to` is null, falls back to
 * the number of days since `referenceStart` (earliest created_at of dataset).
 */
export function rangeDays(
  range: DateRange,
  referenceStart: Date | null,
  now: Date = new Date()
): number {
  const from = range.from ?? referenceStart ?? now;
  const to = range.to ?? now;
  const days = differenceInCalendarDays(to, from) + 1;
  return Math.max(days, 1);
}
