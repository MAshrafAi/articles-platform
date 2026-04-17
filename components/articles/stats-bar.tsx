import { FileText, TrendingUp } from "lucide-react";
import { rangeDays, type DateRange } from "@/lib/date-range";

interface StatsBarProps {
  totalCount: number;
  range: DateRange;
  firstArticleDate: Date | null;
}

export function StatsBar({ totalCount, range, firstArticleDate }: StatsBarProps) {
  const days = rangeDays(range, firstArticleDate);
  const dailyAvg = totalCount > 0 ? totalCount / days : 0;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2">
      <StatCard
        icon={<FileText className="h-5 w-5" />}
        label="إجمالي المقالات"
        value={totalCount.toLocaleString("ar-EG")}
        sub="في النطاق المحدد"
        accent="slate"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        label="معدل النشر اليومي"
        value={dailyAvg < 1 && dailyAvg > 0 ? dailyAvg.toFixed(2) : Math.round(dailyAvg).toLocaleString("ar-EG")}
        sub={`متوسط خلال ${days} يوم`}
        accent="emerald"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: "slate" | "emerald";
}) {
  const accentClasses =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${accentClasses}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}
