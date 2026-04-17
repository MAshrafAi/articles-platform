"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Loader2, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  changeUserRoleAction,
  deleteUserAction,
} from "@/app/(protected)/settings/roles/actions";
import type { UserRole } from "@/lib/auth";

interface UserRowActionsProps {
  userId: string;
  userName: string;
  currentRole: UserRole;
}

export function UserRowActions({
  userId,
  userName,
  currentRole,
}: UserRowActionsProps) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>(currentRole);
  const [pending, startTransition] = useTransition();

  const handleRoleChange = () => {
    if (newRole === currentRole) {
      setRoleDialogOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await changeUserRoleAction({ userId, newRole });
      if (result.ok) {
        toast.success("تم تحديث الدور بنجاح");
        setRoleDialogOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUserAction({ userId });
      if (result.ok) {
        toast.success("تم حذف المستخدم");
        setDeleteDialogOpen(false);
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
            onClick={() => {
              setNewRole(currentRole);
              setRoleDialogOpen(true);
            }}
          >
            <ShieldCheck className="ms-2 h-4 w-4" />
            تغيير الدور
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <Trash2 className="ms-2 h-4 w-4" />
            حذف المستخدم
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={roleDialogOpen}
        onOpenChange={(next) => !pending && setRoleDialogOpen(next)}
      >
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>تغيير دور المستخدم</DialogTitle>
            <DialogDescription>
              تعديل دور <span className="font-medium text-slate-700">{userName}</span> في المنصة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="role-select">الدور الجديد</Label>
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as UserRole)}
            >
              <SelectTrigger id="role-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="employee">موظف</SelectItem>
                <SelectItem value="admin">أدمن</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setRoleDialogOpen(false)}
              disabled={pending}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleRoleChange}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(next) => !pending && setDeleteDialogOpen(next)}
      >
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader className="text-start sm:text-start">
            <DialogTitle>تأكيد حذف المستخدم</DialogTitle>
            <DialogDescription>
              سيتم حذف <span className="font-medium text-slate-700">{userName}</span> نهائياً من المنصة، ولن يتمكن من الدخول بعد ذلك. هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(false)}
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
