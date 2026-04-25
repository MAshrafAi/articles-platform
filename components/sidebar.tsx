"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  FileText,
  Settings,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import type { AppUser } from "@/lib/auth";

interface NavLeaf {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  children: NavLeaf[];
  defaultOpen?: boolean;
}

interface SidebarProps {
  user: AppUser;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ user, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";

  const articles: NavLeaf = {
    label: "المقالات",
    href: "/articles",
    icon: FileText,
  };

  const products: NavLeaf = {
    label: "المنتجات",
    href: "/products",
    icon: ShoppingBag,
  };

  const settingsChildren: NavLeaf[] = [];
  if (isAdmin) {
    settingsChildren.push({
      label: "أدوار المنصة",
      href: "/settings/roles",
      icon: ShieldCheck,
    });
    settingsChildren.push({
      label: "البرومتات",
      href: "/settings/prompts",
      icon: Sparkles,
    });
    settingsChildren.push({
      label: "السجل",
      href: "/settings/logs",
      icon: ScrollText,
    });
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex h-screen w-[280px] max-w-[85vw] shrink-0 flex-col border-l border-slate-200 bg-white transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:w-[272px] lg:max-w-none lg:translate-x-0 lg:transition-none",
        mobileOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
      )}
    >
      <div className="flex items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <span className="text-base font-bold text-white">م</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">منصة محتوى</p>
            <p className="text-xs text-slate-500">لوحة الإدارة</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="إغلاق القائمة"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavLink
          item={articles}
          active={pathname === articles.href || pathname.startsWith("/articles/")}
        />
        <NavLink
          item={products}
          active={pathname === products.href || pathname.startsWith("/products/")}
        />

        {settingsChildren.length > 0 && (
          <CollapsibleSection
            group={{
              label: "الإعدادات",
              icon: Settings,
              children: settingsChildren,
              defaultOpen: pathname.startsWith("/settings"),
            }}
            pathname={pathname}
          />
        )}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavLeaf; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function CollapsibleSection({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? false);
  const GroupIcon = group.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <GroupIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-start">{group.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="mt-1 space-y-1 pr-4">
          {group.children.map((child) => {
            const Icon = child.icon;
            const active = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
