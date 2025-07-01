'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
      <div className="h-screen flex bg-gray-50">
        {/* Sidebar - Fixed on the left */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto">
            <div className="py-2">
              <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-1">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
  );
}