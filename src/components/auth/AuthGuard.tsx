
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, AuthUser } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Scale, AlertTriangle } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredUserType?: 'citizen' | 'lawyer' | 'admin';
  requireVerification?: boolean;
}

export function AuthGuard({ 
  children, 
  requiredUserType, 
  requireVerification = false 
}: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        const { isAuthenticated, user, needsVerification } = await checkAuth();

        if (!isAuthenticated) {
          router.push('/auth/login');
          return;
        }

        if (!user) {
          setError('User data not found');
          return;
        }

        // Check user type requirements
        if (requiredUserType && user.user_type !== requiredUserType) {
          router.push('/unauthorized');
          return;
        }

        // Check verification requirements
        if (requireVerification && needsVerification) {
          router.push('/auth/verification-pending');
          return;
        }

        setUser(user);
      } catch (error) {
        console.error('Auth validation error:', error);
        setError('Authentication error occurred');
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, [router, requiredUserType, requireVerification]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Scale className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  LegalAI
                </span>
              </div>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Verifying your session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">Authentication Error</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
