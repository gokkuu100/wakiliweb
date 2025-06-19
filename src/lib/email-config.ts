// Email configuration utilities for Supabase Auth

export const getBaseUrl = () => {
  // In production, use the actual domain
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://yourapp.com';
  }
  
  // In development, use localhost
  return 'http://localhost:3000';
};

export const getEmailRedirectUrl = (userId?: string) => {
  const path = '/auth/email-verified';
  const baseUrl = getBaseUrl();
  return userId ? `${baseUrl}${path}?user_id=${userId}` : `${baseUrl}${path}`;
};

// Email templates configuration for Supabase
export const emailTemplates = {
  confirm: {
    subject: 'Confirm your email - LegalAI',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">⚖️ LegalAI</h1>
          <h2 style="color: #1f2937; margin-top: 0;">Confirm Your Email Address</h2>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: #374151;">
            Thanks for signing up for LegalAI! To complete your registration, please confirm your email address by clicking the button below:
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ .ConfirmationURL }}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Confirm Email Address
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="font-size: 14px; color: #6b7280; margin: 0;">
            If you didn't create an account with LegalAI, you can safely ignore this email.
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
          </p>
        </div>
      </div>
    `
  }
};

// Instructions for Supabase Dashboard setup
export const setupInstructions = `
## Supabase Email Setup Instructions

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Settings
3. Scroll down to "Email Templates"
4. For "Confirm signup" template, use:

Subject: Verify your email - LegalAI

Body: Use the template from email-verification-template.html

5. Set your Site URL to: ${getBaseUrl()}
6. Add redirect URLs in Authentication > URL Configuration:
   - ${getBaseUrl()}/auth/email-verified
   - ${getBaseUrl()}/auth/reset-password

7. Make sure your email provider is configured (SMTP settings)
`;
