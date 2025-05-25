'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import AdminNav from '@/components/layout/admin-nav';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <AdminNav />
      <main className="pt-4">
        {children}
      </main>
    </div>
  );
} 