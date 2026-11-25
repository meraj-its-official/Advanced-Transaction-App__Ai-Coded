"use client";

import React, { useState } from "react";
import {
  Bell,
  Menu,
  Shield,
  CheckCheck,
  CreditCard,
  Send,
  Download,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationsStore } from "@/store/notifications.store";
import { getInitials, formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
  onOpenProfile?: () => void;
  title?: string;
  isSidebarVisible?: boolean;
}

export function Header({
  onMenuClick,
  onOpenProfile,
  title,
  isSidebarVisible,
}: HeaderProps) {
  const { user } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationsStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "PAYMENT_RECEIVED":
        return <Download className="w-4 h-4 text-emerald-400" />;
      case "PAYMENT_SENT":
        return <Send className="w-4 h-4 text-rose-400" />;
      case "WALLET_TOPPED_UP":
      case "WITHDRAWAL":
        return <CreditCard className="w-4 h-4 text-indigo-400" />;
      default:
        return <Shield className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16  bg-[#0a0a0f]/80 backdrop-blur-md border-b border-[#090808] py-8 my-4 px-4 md:px-8 flex items-center justify-between">
      {/* Left: Menu toggle & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#12121a] border border-[#1e1e2e] transition-all flex items-center gap-2"
          aria-label="Toggle navigation menu"
          title="Toggle Navigation Menu (Hide/Show Sidebar)"
        >
          <Menu className="w-4 h-4 text-slate-300" />
          <span className="hidden md:inline text-xs font-medium text-slate-400">
            {!isSidebarVisible ? "Hide Menu" : "Show Menu"}
          </span>
        </button>
        {title && (
          <h1 className="text-lg font-semibold text-white tracking-tight hidden sm:block">
            {title}
          </h1>
        )}
        <span className="hidden md:ml-1 sm:block items-center">
          <h1 className="py-2 text-5xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            PayFlow
          </h1>
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-[#12121a] hover:bg-[#1a1a27] border border-[#1e1e2e] text-slate-300 hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-md shadow-rose-500/50">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#12121a] border border-[#1e1e2e] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-[#1e1e2e] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#1e1e2e]/50">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={cn(
                          "p-3.5 flex gap-3 hover:bg-[#1a1a27] cursor-pointer transition-colors text-left",
                          !n.isRead && "bg-indigo-500/[0.03]",
                        )}
                      >
                        <div className="p-2 rounded-xl bg-[#1e1e2e] shrink-0 h-fit">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-slate-200 truncate">
                              {n.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatRelativeDate(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 self-center" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Chip -> Opens Profile Card */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 pl-3 border-l border-[#1e1e2e] hover:opacity-90 transition-all text-left cursor-pointer group"
          title="Click to view full Profile Card"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow group-hover:scale-105 transition-transform">
            {user?.name ? getInitials(user.name) : "PF"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight group-hover:text-indigo-300 transition-colors">
              {user?.name || "PayFlow User"}
            </p>
            <p className="text-[10px] text-emerald-400 font-medium leading-tight">
              ● Verified
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;
