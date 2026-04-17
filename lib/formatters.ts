const dateFormatter = new Intl.DateTimeFormat("ar", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const datetimeFormatter = new Intl.DateTimeFormat("ar", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return "—";
  }
}

export function formatDateTime(iso: string): string {
  try {
    return datetimeFormatter.format(new Date(iso));
  } catch {
    return "—";
  }
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return formatDate(iso);
}
