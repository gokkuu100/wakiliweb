-- Function to handle email verification and update user status
-- This function will be called from the email verification page

CREATE OR REPLACE FUNCTION public.verify_user_email(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_exists boolean;
  auth_user_verified boolean;
BEGIN
  -- Check if user exists in auth.users and is verified
  SELECT 
    EXISTS(SELECT 1 FROM auth.users WHERE id = user_id),
    COALESCE(email_confirmed_at IS NOT NULL, false)
  INTO user_exists, auth_user_verified
  FROM auth.users 
  WHERE id = user_id;
  
  -- If user doesn't exist or email not verified in auth, return false
  IF NOT user_exists OR NOT auth_user_verified THEN
    RETURN false;
  END IF;
  
  -- Update the user profile verification status
  UPDATE public.users 
  SET 
    is_verified = true,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Return true if update was successful
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_user_email(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_email(uuid) TO anon;
