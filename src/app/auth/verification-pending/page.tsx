
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scale, Clock, Mail, LogOut } from 'lucide-react';

export default function VerificationPendingPage() {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setSigningOut(false);
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

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Account Verification Pending</CardTitle>
            <CardDescription className="text-base">
              Your lawyer account is currently under review
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="border-yellow-200 bg-yellow-50">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                <strong>What happens next?</strong>
                <br />
                Our team is reviewing your lawyer credentials. This process typically takes 1-2 business days.
                You will receive an email notification once your account has been verified.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Verification Process:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Account created successfully
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    Credentials under review
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                    Account verification complete
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
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

            <div className="flex flex-col space-y-3">
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
      </div>
    </div>
  );
}
