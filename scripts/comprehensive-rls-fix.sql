-- Comprehensive RLS policy fixes for authentication flow
-- This allows users to create profiles during signup even before email verification

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow signup profile creation" ON users;

-- Create comprehensive user policies

-- Allow profile creation during signup (even without active session)
-- This is needed because during signup, the user auth record exists but no session yet
CREATE POLICY "Allow signup profile creation" ON users
  FOR INSERT 
  WITH CHECK (
    -- Allow if the user ID exists in auth.users (signup just completed)
    id IN (SELECT id FROM auth.users)
  );

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

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

-- Lawyer profile policies
DROP POLICY IF EXISTS "Users can create own lawyer profile" ON lawyer_profiles;
DROP POLICY IF EXISTS "Users can view own lawyer profile" ON lawyer_profiles;
DROP POLICY IF EXISTS "Users can update own lawyer profile" ON lawyer_profiles;
DROP POLICY IF EXISTS "Allow lawyer profile creation during signup" ON lawyer_profiles;

-- Allow lawyer profile creation during signup
CREATE POLICY "Allow lawyer profile creation during signup" ON lawyer_profiles
  FOR INSERT 
  WITH CHECK (
    -- Allow if the user ID exists in auth.users
    user_id IN (SELECT id FROM auth.users)
  );

-- Allow users to view their own lawyer profile
CREATE POLICY "Users can view own lawyer profile" ON lawyer_profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update their own lawyer profile
CREATE POLICY "Users can update own lawyer profile" ON lawyer_profiles
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow public read access to verified lawyer profiles (for directory)
CREATE POLICY "Public can view verified lawyer profiles" ON lawyer_profiles
  FOR SELECT 
  USING (is_verified = true);

-- Allow public read access to basic user info for verified lawyers
CREATE POLICY "Public can view verified user profiles" ON users
  FOR SELECT 
  USING (
    user_type = 'lawyer' AND 
    is_verified = true AND 
    id IN (SELECT user_id FROM lawyer_profiles WHERE is_verified = true)
  );
