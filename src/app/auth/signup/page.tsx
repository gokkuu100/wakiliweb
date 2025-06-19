
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scale, Eye, EyeOff, Loader2, User, Briefcase, CheckCircle, XCircle } from 'lucide-react';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: searchParams.get('type') === 'lawyer' ? 'lawyer' : '',
    phoneNumber: '',
    location: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { signUp, isLoading, error } = useAuth();
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.userType) {
      setLocalError('Please select your account type');
      return;
    }

    try {
      setSuccess('Creating your account...');

      // Use the context signup function
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        user_type: formData.userType,
        phone_number: formData.phoneNumber,
        location: formData.location
      });

      setSuccess('Account created successfully! Please check your email for verification link.');
      
      // Redirect is handled in the signUp function
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('User already registered')) {
        setLocalError('This email is already registered. Please use a different email or sign in.');
      } else if (error.message.includes('duplicate key')) {
        setLocalError('This email is already registered. Please use a different email or try signing in.');
      } else if (error.message.includes('password')) {
        setLocalError('Password issue: ' + error.message);
      } else if (error.message.includes('email')) {
        setLocalError('Email issue: ' + error.message);
      } else if (error.message.includes('Failed to create user profile')) {
        setLocalError('Failed to create your profile. This might be a temporary issue. Please try again in a few moments.');
      } else if (error.message.includes('row-level security')) {
        setLocalError('Database permission error. Please contact support if this issue persists.');
      } else if (error.message.includes('permission denied')) {
        setLocalError('Permission denied. Please contact support if this issue persists.');
      } else {
        setLocalError(error.message || 'An error occurred during signup. Please try again.');
      }
      
      setSuccess('');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join LegalAI and access powerful legal tools</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {(error || localError) && (
                <Alert className="border-red-200 bg-red-50 animate-pulse">
                  <XCircle className="h-4 w-4 text-red-800 mr-2" />
                  <AlertDescription className="text-red-800 flex-1">
                    {localError || error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <div className="mb-4">
                  <Alert className="border-green-200 bg-green-50 mb-2">
                    <AlertDescription className="text-green-800 flex items-center">
                      {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                      {success}
                    </AlertDescription>
                  </Alert>
                  
                  {/* Progress bar for better visual feedback */}
                  {isLoading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full animate-pulse" 
                        style={{ 
                          width: success === 'Creating your account...' ? '33%' : 
                                 success === 'Account created, setting up your profile...' ? '66%' :
                                 success === 'Setting up your lawyer profile...' ? '90%' : '100%'
                        }}>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Type Selection */}
              <div className="space-y-3">
                <Label>I am a:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={formData.userType === 'citizen' ? 'default' : 'outline'}
                    className={`h-20 flex-col space-y-2 ${
                      formData.userType === 'citizen' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'hover:bg-blue-50'
                    }`}
                    onClick={() => handleInputChange('userType', 'citizen')}
                  >
                    <User className="h-6 w-6" />
                    <span>Citizen</span>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.userType === 'lawyer' ? 'default' : 'outline'}
                    className={`h-20 flex-col space-y-2 ${
                      formData.userType === 'lawyer' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'hover:bg-blue-50'
                    }`}
                    onClick={() => handleInputChange('userType', 'lawyer')}
                  >
                    <Briefcase className="h-6 w-6" />
                    <span>Legal Professional</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+254..."
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="City, Kenya"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="h-12 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    className="h-12 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 relative"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="opacity-0">Create Account</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
