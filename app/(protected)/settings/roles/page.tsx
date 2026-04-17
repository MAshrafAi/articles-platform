import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppUser } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge } from "@/components/role-badge";
import { InviteDialog } from "@/components/invite-dialog";
import { UserRowActions } from "@/components/user-row-actions";
import { formatDate } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const current = await requireAdmin();

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: true });

  const users = (data ?? []) as AppUser[];

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            أدوار المنصة
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            إدارة الموظفين والأدمن في المنصة — إرسال دعوات، تعديل الأدوار، وإزالة المستخدمين
          </p>
        </div>
        <InviteDialog />
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-start text-slate-600">الاسم</TableHead>
              <TableHead className="text-start text-slate-600">البريد الإلكتروني</TableHead>
              <TableHead className="text-start text-slate-600">الدور</TableHead>
              <TableHead className="text-start text-slate-600">تاريخ الانضمام</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                  لا يوجد مستخدمون بعد
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelf = user.id === current.id;
                const displayName = user.full_name || user.email.split("@")[0];
                return (
                  <TableRow key={user.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">
                      {displayName}
                      {isSelf && (
                        <span className="mr-2 text-xs font-normal text-slate-400">
                          (أنت)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span dir="ltr" className="text-start text-slate-600">
                        {user.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      {!isSelf && (
                        <UserRowActions
                          userId={user.id}
                          userName={displayName}
                          currentRole={user.role}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
