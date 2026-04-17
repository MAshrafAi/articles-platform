import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/auth";

export function RoleBadge({ role }: { role: UserRole }) {
  if (role === "admin") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
        أدمن
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">
      موظف
    </Badge>
  );
}
