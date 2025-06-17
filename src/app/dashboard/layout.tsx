'use client';

import { DashboardStatsProvider } from '@/hooks/useDatabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardStatsProvider>
      {children}
    </DashboardStatsProvider>
  );
}
