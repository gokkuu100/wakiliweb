'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scale, CheckCircle, Loader2 } from 'lucide-react';

export default function EmailVerifiedPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        // If no session or no user, the email verification didn't work
        if (!session || !session.user) {
          setError('Email verification failed or has expired. Please request a new verification link.');
          setLoading(false);
          return;
        }

        setUserEmail(session.user.email || '');

        // Update the is_verified status in the users table
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating verification status:', updateError);
          throw updateError;
        }

      } catch (error: any) {
        console.error('Error during email verification:', error);
        setError(error.message || 'An error occurred during email verification.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Scale className="h-10 w-10 text-blue-600" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LegalAI
            </span>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          {loading ? (
            <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Verifying your email...</p>
            </CardContent>
          ) : error ? (
            <CardContent className="pt-6 space-y-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <CardTitle className="text-2xl">Verification Failed</CardTitle>
                <CardDescription className="text-base">{error}</CardDescription>
              </div>

              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  If you continue to experience issues, please contact support or try resending the verification email.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col space-y-3">
                <Link href="/auth/verification-pending">
                  <Button className="w-full">Resend Verification Email</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">Return to Login</Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <CardContent className="pt-6 space-y-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Email Verified Successfully!</CardTitle>
                <CardDescription className="text-base">
                  {userEmail ? `Your email ${userEmail} has been verified.` : 'Your account has been verified.'}
                </CardDescription>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  <strong>Your account is now active!</strong>
                  <br />
                  You can now sign in and access all features of LegalAI.
                </AlertDescription>
              </Alert>

              <Button className="w-full h-12" onClick={() => router.push('/auth/login')}>
                Sign In to Your Account
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
