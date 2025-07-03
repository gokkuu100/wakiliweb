'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scale, Clock, Mail, LogOut, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function VerificationPendingPage() {
  const router = useRouter();
  const { signOut, resendVerificationEmail, isLoading, error } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isLawyerVerified, setIsLawyerVerified] = useState(false);
  const [isLawyer, setIsLawyer] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Check verification status on page load and poll for changes
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
          setLoading(false);
          return;
        }
        
        // Check if email is verified in Supabase auth
        const emailConfirmed = !!session.user.email_confirmed_at;
        setIsEmailVerified(emailConfirmed);
        setUserEmail(session.user.email || '');
        
        // Query the user in the database to check if they're fully verified and their type
        if (emailConfirmed) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_type, is_verified')
            .eq('id', session.user.id)
            .single();
          
          if (userError) {
            console.error('Error fetching user data:', userError);
          } else if (userData) {
            // Update verification status in the database if email is confirmed
            if (!userData.is_verified) {
              await supabase
                .from('users')
                .update({ is_verified: true })
                .eq('id', session.user.id);
            }
            
            setIsLawyer(userData.user_type === 'lawyer');
            
            // If lawyer, check if they've been approved by admin
            if (userData.user_type === 'lawyer') {
              const { data: lawyerData, error: lawyerError } = await supabase
                .from('lawyer_profiles')
                .select('is_verified')
                .eq('user_id', session.user.id)
                .single();
                
              if (!lawyerError && lawyerData) {
                setIsLawyerVerified(lawyerData.is_verified);
              }
            }
            
            // If fully verified, redirect to dashboard after a short delay
            if (emailConfirmed) {
              if (userData.user_type === 'lawyer') {
                // Only redirect if we have lawyer data and they are verified by admin
                const { data: lawyerProfileData, error: lawyerProfileError } = await supabase
                  .from('lawyer_profiles')
                  .select('is_verified')
                  .eq('user_id', session.user.id)
                  .single();
                  
                if (!lawyerProfileError && lawyerProfileData && lawyerProfileData.is_verified) {
                  setTimeout(() => {
                    router.push('/lawyer');
                  }, 3000);
                }
              } else {
                // For regular users, redirect immediately upon email verification
                setTimeout(() => {
                  router.push('/citizen');
                }, 3000);
              }
            }
          }
        }
        
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('user_type, is_verified')
          .eq('id', session.user.id)
          .single();
          
        if (profile) {
          setIsLawyer(profile.user_type === 'lawyer');
          setIsLawyerVerified(profile.is_verified);
          
          // If all verification is complete, redirect to appropriate dashboard
          if (isEmailVerified) {
            if (profile.user_type === 'lawyer') {
              // For lawyers, check admin verification in lawyer_profiles
              const { data: lawyerProfileCheck, error: lawyerProfileError } = await supabase
                .from('lawyer_profiles')
                .select('is_verified')
                .eq('user_id', session.user.id)
                .single();
                
              if (!lawyerProfileError && lawyerProfileCheck && lawyerProfileCheck.is_verified) {
                setTimeout(() => {
                  router.push('/lawyer');
                }, 3000);
              }
            } else if (profile.user_type === 'admin') {
              setTimeout(() => {
                router.push('/admin');
              }, 3000);
            } else {
              // For regular users
              setTimeout(() => {
                router.push('/citizen');
              }, 3000);
            }
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkVerificationStatus();
  }, [router, isEmailVerified, isLawyer]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setSigningOut(false);
    }
  };
  
  // Function to resend verification email
  const handleResendEmail = async () => {
    try {
      setEmailError('');
      
      await resendVerificationEmail();
      
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (error: any) {
      console.error('Error resending email:', error);
      setEmailError(error.message || 'Failed to resend verification email');
    }
  };

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

        {loading ? (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Checking verification status...</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                {isEmailVerified && (!isLawyer || isLawyerVerified) ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <Clock className="h-8 w-8 text-yellow-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {isEmailVerified && (!isLawyer || isLawyerVerified)
                  ? "Account Verified!"
                  : "Account Verification Pending"}
              </CardTitle>
              <CardDescription className="text-base">
                {isEmailVerified && isLawyer && !isLawyerVerified
                  ? "Your email is verified, awaiting lawyer credentials review"
                  : isEmailVerified
                  ? "Your account is fully verified"
                  : "Your account registration is almost complete"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {!isEmailVerified ? (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <Mail className="h-4 w-4" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Email Verification Required</strong>
                    <br />
                    Please check your email ({userEmail || "your inbox"}) for a verification link to complete your registration.
                    You must click the link in the email to verify your account before you can log in.
                  </AlertDescription>
                </Alert>
              ) : isLawyer && !isLawyerVerified ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-blue-800">
                    <strong>Lawyer Verification In Progress</strong>
                    <br />
                    Your email is verified, but we need to review your credentials before granting full access.
                    This typically takes 1-2 business days. We'll notify you by email when approved.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-800">
                    <strong>All Set!</strong>
                    <br />
                    Your account is fully verified. You'll be redirected to your dashboard momentarily.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Verification Process:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className={`w-2 h-2 ${true ? 'bg-green-500' : 'bg-gray-300'} rounded-full mr-3`}></div>
                      Account created successfully
                    </li>
                    <li className="flex items-center">
                      <div className={`w-2 h-2 ${isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'} rounded-full mr-3`}></div>
                      Email verification
                    </li>
                    {isLawyer && (
                      <li className="flex items-center">
                        <div className={`w-2 h-2 ${isLawyerVerified ? 'bg-green-500' : 'bg-yellow-500'} rounded-full mr-3`}></div>
                        Legal credentials verification
                      </li>
                    )}
                    <li className="flex items-center">
                      <div className={`w-2 h-2 ${isEmailVerified && (!isLawyer || isLawyerVerified) ? 'bg-green-500' : 'bg-gray-300'} rounded-full mr-3`}></div>
                      Full platform access granted
                    </li>
                  </ul>
                </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  If you have questions about the verification process or need to update your information:
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-blue-700">📧 Email: verification@legalai.com</p>
                  <p className="text-blue-700">📞 Phone: +254 700 000 000</p>
                  <p className="text-blue-700">🕒 Hours: Mon-Fri, 8:00 AM - 6:00 PM EAT</p>
                </div>
              </div>
              </div>

            {emailError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {emailError}
                </AlertDescription>
              </Alert>
            )}
            
            {emailSent && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-800 mr-2" />
                <AlertDescription className="text-green-800">
                  Verification email has been resent. Please check your inbox.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleResendEmail}
                variant="default"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Verification Email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full h-12"
                disabled={signingOut}
              >
                {signingOut ? (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <Link 
                  href="/contact" 
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
