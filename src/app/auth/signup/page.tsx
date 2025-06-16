
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signupStage, setSignupStage] = useState<'idle' | 'auth' | 'profile' | 'lawyer' | 'complete' | 'error'>('idle');
  const router = useRouter();
  
  // Monitor the signup process for better feedback
  useEffect(() => {
    if (loading) {
      if (success === 'Creating your account...') {
        setSignupStage('auth');
      } else if (success === 'Account created, setting up your profile...') {
        setSignupStage('profile');
      } else if (success === 'Setting up your lawyer profile...') {
        setSignupStage('lawyer');
      }
    } else if (success && !loading) {
      setSignupStage('complete');
    } else if (error) {
      setSignupStage('error');
    } else {
      setSignupStage('idle');
    }
  }, [loading, success, error]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!formData.userType) {
      setError('Please select your account type');
      setLoading(false);
      return;
    }

    try {
      // Set temporary success message to provide feedback
      setSuccess('Creating your account...');

      // Step 1: Sign up with Supabase Auth - this creates the auth.users record
      // We're using email confirmation flow, so user will need to confirm before they can log in
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: formData.userType,
            phone_number: formData.phoneNumber || '',
            location: formData.location || '',
          },
          // The redirect URL after email verification
          emailRedirectTo: `${window.location.origin}/auth/email-verified`
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        setSuccess('');
        throw authError;
      }

      if (!authData.user) {
        setSuccess('');
        throw new Error('Failed to create account');
      }
      
      setSuccess('Account created, setting up your profile...');

      // Step 2: Insert user profile data - all users start as unverified until email confirmation
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          user_type: formData.userType as 'citizen' | 'lawyer',
          phone_number: formData.phoneNumber || null,
          location: formData.location || null,
          is_verified: false, // All users start as unverified until email confirmation
          avatar_url: null
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        setSuccess('');
        
        // We can't use admin.deleteUser without admin privileges
        // Log the error and let the user know
        console.error(`User created in auth but failed in database: ${authData.user.id}`);
        
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      // Step 3: If lawyer, create lawyer profile
      if (formData.userType === 'lawyer') {
        setSuccess('Setting up your lawyer profile...');
        
        const { error: lawyerError } = await supabase
          .from('lawyer_profiles')
          .insert({
            user_id: authData.user.id,
            is_verified: false,
            firm_name: '',
            practice_areas: [],
            bar_number: null,
            years_experience: 0,
            education: null,
            certifications: [],
            bio: null,
            hourly_rate: 0,
            verification_documents: [],
            rating: 0,
            total_reviews: 0,
            response_time_hours: 24
          });

        if (lawyerError) {
          console.error('Lawyer profile error:', lawyerError);
          setSuccess('');
          throw new Error(`Failed to create lawyer profile: ${lawyerError.message}`);
        }
      }

      // Step 4: Sign out to ensure clean state
      await supabase.auth.signOut();
      
      setSuccess('Account created successfully! Please check your email for verification link.');
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/auth/verification-pending');
      }, 3000);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Email')) {
        setError('This email is already registered. Please use a different email or sign in.');
      } else if (error.message.includes('password')) {
        setError('Password issue: ' + error.message);
      } else if (error.message.includes('profile')) {
        setError('Error creating profile: The database might be temporarily unavailable. Please try again.');
      } else {
        setError(error.message || 'An error occurred during signup. Please try again.');
      }
      
      // Clear any success message that might be displaying
      setSuccess('');
    } finally {
      setLoading(false);
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
              {error && (
                <Alert className="border-red-200 bg-red-50 animate-pulse">
                  <XCircle className="h-4 w-4 text-red-800 mr-2" />
                  <AlertDescription className="text-red-800 flex-1">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <div className="mb-4">
                  <Alert className="border-green-200 bg-green-50 mb-2">
                    <AlertDescription className="text-green-800 flex items-center">
                      {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                      {success}
                    </AlertDescription>
                  </Alert>
                  
                  {/* Progress bar for better visual feedback */}
                  {loading && (
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
                disabled={loading}
              >
                {loading ? (
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
