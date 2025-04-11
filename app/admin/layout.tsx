'use client';

import { ReactNode } from 'react';
import { Toaster } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      {children}
    </div>
  );
} 