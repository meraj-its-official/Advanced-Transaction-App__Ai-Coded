import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'PayFlow — Smart Payments',
  description: 'Fast, secure digital payments for everyone',
  keywords: ['payments', 'wallet', 'fintech', 'UPI'],
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-slate-100 antialiased min-h-screen font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#12121a',
              color: '#f1f5f9',
              border: '1px solid #1e1e2e',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#12121a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#12121a' } },
          }}
        />
      </body>
    </html>
  );
}
