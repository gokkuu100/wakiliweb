-- Add missing RLS policies for signup flow

-- Enable RLS on lawyer_profiles if not already enabled
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile during signup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Allow users to manage their lawyer profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'lawyer_profiles' 
        AND policyname = 'Users can create own lawyer profile'
    ) THEN
        CREATE POLICY "Users can create own lawyer profile" ON lawyer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'lawyer_profiles' 
        AND policyname = 'Users can view own lawyer profile'
    ) THEN
        CREATE POLICY "Users can view own lawyer profile" ON lawyer_profiles FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'lawyer_profiles' 
        AND policyname = 'Users can update own lawyer profile'
    ) THEN
        CREATE POLICY "Users can update own lawyer profile" ON lawyer_profiles FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;
