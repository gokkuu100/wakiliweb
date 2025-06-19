#!/bin/bash

# Script to help debug Supabase email verification issues

echo "🔍 LegalAI Email Verification Debug Script"
echo "============================================="
echo ""

echo "📝 Current Configuration:"
echo "- Next.js App URL: http://localhost:3000"
echo "- Expected Redirect: http://localhost:3000/auth/email-verified"
echo ""

echo "✅ Setup Checklist for Supabase Dashboard:"
echo "1. Go to Authentication > Settings in your Supabase dashboard"
echo "2. Set Site URL to: http://localhost:3000"
echo "3. Add Redirect URLs:"
echo "   - http://localhost:3000/auth/email-verified"
echo "   - http://localhost:3000/auth/reset-password"
echo ""

echo "4. Configure Email Template (Authentication > Templates):"
echo "   Subject: Confirm your email - LegalAI"
echo "   Body should include: {{ .ConfirmationURL }}"
echo ""

echo "5. Check Email Provider Settings (if using custom SMTP)"
echo "6. Verify your project's email settings are not in sandbox mode"
echo ""

echo "🧪 To test:"
echo "1. Start the app: npm run dev"
echo "2. Go to http://localhost:3000/auth/signup"
echo "3. Create a new account"
echo "4. Check your email for the verification link"
echo ""

echo "🐛 If emails are empty:"
echo "- Check that {{ .ConfirmationURL }} is in the email template"
echo "- Verify redirect URLs are correctly configured"
echo "- Ensure Site URL matches your development URL"
echo ""

echo "💡 For production, update:"
echo "- NEXT_PUBLIC_SITE_URL environment variable"
echo "- Supabase Site URL setting"
echo "- Redirect URLs to match your production domain"
