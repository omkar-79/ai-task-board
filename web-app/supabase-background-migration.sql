-- Migration to add background_image field to user_profiles table
-- Run this in your Supabase SQL editor

-- Add background_image column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN background_image TEXT DEFAULT 'default';

-- Update existing records to have default background
UPDATE user_profiles 
SET background_image = 'default' 
WHERE background_image IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN user_profiles.background_image IS 'User selected background image for the task board'; 