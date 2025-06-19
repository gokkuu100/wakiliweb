#!/bin/bash

# Setup script for LegalAI authentication flow
# This script will help you set up the database policies and email configuration

echo "🔧 Setting up LegalAI Authentication Flow..."
echo ""

echo "📋 Summary of changes needed:"
echo "1. Database RLS policies need to be updated"
echo "2. Email verification function needs to be created"
echo "3. Supabase email templates need configuration"
echo ""

echo "🗄️  Database Setup:"
echo "Run these SQL scripts in your Supabase SQL Editor:"
echo ""
echo "1. First, run the comprehensive RLS fix:"
echo "   scripts/comprehensive-rls-fix.sql"
echo ""
echo "2. Then, run the email verification function:"
echo "   scripts/email-verification-function.sql"
echo ""

echo "📧 Email Configuration:"
echo "In your Supabase dashboard (Authentication > Email Templates):"
echo "1. Edit 'Confirm signup' template"
echo "2. Make sure the confirmation URL includes:"
echo "   {{ .ConfirmationURL }}"
echo "3. Set the redirect URL to: http://localhost:3000/auth/email-verified"
echo ""

echo "🌐 Environment Variables:"
echo "Make sure your .env.local includes:"
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000"
echo ""

echo "🔄 How the new flow works:"
echo "1. User signs up with email/password"
echo "2. User profile is created immediately in the database (is_verified=false)"
echo "3. Verification email is sent to user"
echo "4. User clicks verification link in email"
echo "5. Email verification page updates is_verified=true"
echo "6. User can now login successfully"
echo ""

echo "✅ This approach fixes:"
echo "- RLS policy violations during signup"
echo "- Cross-browser/cross-device email verification"
echo "- Proper email verification flow"
echo "- Better error handling and user feedback"
echo ""

echo "🚀 Ready to test!"
echo "After running the SQL scripts and configuring emails, try:"
echo "1. npm run dev"
echo "2. Go to signup page"
echo "3. Sign up with a real email"
echo "4. Check email for verification link"
echo "5. Click verification link"
echo "6. Try logging in"
