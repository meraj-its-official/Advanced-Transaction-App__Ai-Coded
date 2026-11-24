'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ProfileModal } from '@/components/features/profile-modal';
import { useAuthStore } from '@/store/auth.store';
import { getAccessToken } from '@/lib/auth';
import { authClient } from '@/lib/better-auth-client';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        try {
          const session = await authClient.getSession();
          if (!session?.data?.user) {
            router.push('/login');
          }
        } catch {
          router.push('/login');
        }
      }
    };
    checkAuth();
  }, [router]);

  const handleToggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setIsSidebarVisible((prev) => !prev);
    }
  };

  // Auth checking state
  if (!mounted || (isLoading && !getAccessToken())) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading PayFlow...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex">
      {/* Sidebar (Desktop sticky & Mobile modal) */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isVisible={isSidebarVisible}
        onToggleVisible={() => setIsSidebarVisible((prev) => !prev)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        <Header
          onMenuClick={handleToggleMenu}
          onOpenProfile={() => setIsProfileOpen(true)}
          isSidebarVisible={isSidebarVisible}
        />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Profile Card & Account Management Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
