'use client';

import { useState } from 'react';
import { LawyerSidebar } from './LawyerSidebar';
import { LawyerHeader } from './LawyerHeader';

interface LawyerDashboardLayoutProps {
  children: React.ReactNode;
}

export function LawyerDashboardLayout({ children }: LawyerDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <LawyerSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-72">
        <LawyerHeader setSidebarOpen={setSidebarOpen} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}