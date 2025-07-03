
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Scale, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';
import { supabase } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredUserType?: 'citizen' | 'lawyer' | 'admin';
  requireVerification?: boolean;
}

export function AuthGuard({ 
  children, 
  requiredUserType, 
  requireVerification = true 
}: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, userProfile, isLoading, isAuthenticated, isVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        // Wait for auth state to load
        if (isLoading) {
          setLoading(true);
          return;
        }
        
        setLoading(false);
        
        // If not authenticated, redirect to login
        if (!isAuthenticated || !user) {
          router.push('/auth/login');
          return;
        }
        
        // If email is not verified
        if (isAuthenticated && !user.email_confirmed_at) {
          router.push('/auth/verification-pending');
          return;
        }

        // If authenticated but no user profile
        if (!userProfile) {
          router.push('/auth/verification-pending');
          return;
        }

        // Check verification status - all users must be verified if requireVerification is true
        if (requireVerification && !isVerified) {
          router.push('/auth/verification-pending');
          return;
        }
        
        // Check user type if required
        if (requiredUserType && userProfile.user_type !== requiredUserType) {
          if (userProfile.user_type === 'lawyer') {
            router.push('/lawyer');
          } else if (userProfile.user_type === 'admin') {
            router.push('/admin');
          } else {
            router.push('/citizen');
          }
          return;
        }

        // Lawyers have additional verification requirements
        if (userProfile.user_type === 'lawyer' && requireVerification) {
          // Check if lawyer profile is verified in addition to the basic user verification
          const { data: lawyerProfile } = await supabase
            .from('lawyer_profiles')
            .select('is_verified')
            .eq('user_id', user.id)
            .single();
            
          if (lawyerProfile && !lawyerProfile.is_verified) {
            router.push('/auth/verification-pending');
            return;
          }
        }

        // If we reach here, user is authenticated and verified
      } catch (error: any) {
        console.error('Auth validation error:', error);
        setError(error.message || 'Authentication error occurred');
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, [router, requiredUserType, requireVerification, isLoading, isAuthenticated, isVerified, user, userProfile]);

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
