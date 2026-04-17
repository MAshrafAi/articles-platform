"use client";

import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/role-badge";
import type { AppUser } from "@/lib/auth";

interface UserMenuProps {
  user: AppUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const displayName = user.full_name || user.email.split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg p-2 text-start transition-colors hover:bg-slate-50"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-slate-900 text-xs font-medium text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {displayName}
            </p>
            <div className="mt-0.5">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p
              dir="ltr"
              className="truncate text-start text-xs text-slate-500"
            >
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="post">
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2 text-red-600 focus:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
