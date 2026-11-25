"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Send,
  ArrowLeftRight,
  BarChart3,
  LogOut,
  ShieldCheck,
  X,
  PanelLeftClose,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isVisible?: boolean;
  onToggleVisible?: () => void;
  onOpenProfile?: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/send", label: "Send Money", icon: Send },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({
  isOpen,
  onClose,
  isVisible = true,
  onToggleVisible,
  onOpenProfile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const content = (
    <div className="flex flex-col h-full bg-[#12121a] w-64 select-none">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-[#1e1e2e]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-xl font-black text-white">P</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">
                PayFlow
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Smart Payments</p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {onToggleVisible && (
            <button
              onClick={onToggleVisible}
              title="Hide Sidebar"
              className="hidden md:flex text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e1e2e]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#1e1e2e]",
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                  isActive
                    ? "text-indigo-400"
                    : "text-slate-400 group-hover:text-slate-200",
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User & Security Footer */}
      <div className="p-4 border-t border-[#1e1e2e] space-y-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="font-medium">256-bit Encrypted</span>
        </div>

        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 p-2 rounded-xl bg-[#1a1a27] border border-[#2d2d44] cursor-pointer hover:border-indigo-500/40 hover:bg-[#1f1f30] transition-all group"
          title="Click to view full Profile Card"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow group-hover:scale-105 transition-transform">
            {user?.name ? getInitials(user.name) : "PF"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white">
              {user?.name || "PayFlow User"}
            </p>
            <p className="text-xs text-indigo-400 truncate group-hover:underline flex items-center gap-1">
              Profile Card →
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            title="Sign out"
            className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#252538] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar with hide/show transition */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 shrink-0 z-30 transition-all duration-300 ease-in-out border-r border-[#1e1e2e]",
          !isVisible
            ? "w-64 opacity-100 translate-x-0"
            : "w-0 opacity-0 -translate-x-full overflow-hidden pointer-events-none border-none",
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative z-10 animate-fade-in">{content}</div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
