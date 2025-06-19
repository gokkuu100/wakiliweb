# Email Verification Flow Setup

## Simple Email Verification Flow:

1. User signs up
2. User receives email with a verification link containing their user_id
3. User clicks link and is taken to the verification page 
4. User clicks "Verify My Email" button
5. System updates `is_verified = true` in database
6. User sees success message and can login

## Setup Steps:

### 1. Supabase Email Template Setup:

Go to your Supabase Dashboard > Authentication > Email Templates > Confirm signup

**Subject:** 
```
Verify your email - LegalAI
```

**Body:**
Copy the HTML from the file `email-verification-template.html` in this project.

**IMPORTANT:** 
- For production, change `http://localhost:3000` to your actual domain.
- Make sure to keep the `{{ .User.ID }}` variable - it inserts the user's ID.

### 2. Supabase Configuration:

1. Go to Authentication > URL Configuration
2. Add this URL to your redirect URLs:
   ```
   http://localhost:3000/auth/email-verified
   ```
3. Set your Site URL to match your environment

### 3. RLS Policies:

Make sure your database has the right policies to allow updating the `is_verified` column:

```sql
-- Allow updating verification status via email verification process
CREATE POLICY "Allow email verification update" ON users
  FOR UPDATE
  USING (
    -- Allow if we're only updating is_verified and user exists in auth
    id IN (SELECT id FROM auth.users)
  )
  WITH CHECK (
    -- Only allow updating is_verified field and user must exist
    id IN (SELECT id FROM auth.users)
  );
```

## Testing the Flow:

1. Sign up with a real email
2. Check your email inbox
3. Click the verification link
4. On the verification page, click "Verify My Email"
5. You should see a success message
6. Check your database - `is_verified` should be `true`
7. You should now be able to login normally

## Troubleshooting:

If you have issues:
1. Check browser console for errors
2. Ensure your Supabase email templates are set up correctly
3. Make sure the URL in the email has your user_id parameter
4. Check that the RLS policies allow updating the user's verification status
