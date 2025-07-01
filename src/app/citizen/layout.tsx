'use client';

import { DashboardLayout } from '@/components/citizendashboard/DashboardLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredUserType="citizen">
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
