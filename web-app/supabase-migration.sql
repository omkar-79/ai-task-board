-- Migration script to add timezone support to existing databases
-- Run this in your Supabase SQL editor

-- Add timezone column to user_profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'timezone'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York';
    END IF;
END $$;

-- Update existing user profiles to have a default timezone
UPDATE public.user_profiles 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL OR timezone = '';

-- Create index on timezone for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_timezone ON public.user_profiles(timezone); 