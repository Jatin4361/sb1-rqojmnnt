/*
  # Add token system and account type

  1. Changes
    - Add tokens column to profiles table
    - Add account_type column to profiles table
    - Set default values for new columns
    - Update existing profiles

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tokens integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'free';

-- Update existing profiles to have 5 tokens if they don't have any
UPDATE profiles 
SET tokens = 5 
WHERE tokens IS NULL;

-- Update existing profiles to have 'free' account type if they don't have one
UPDATE profiles 
SET account_type = 'free' 
WHERE account_type IS NULL;

-- Add check constraint for account_type
ALTER TABLE profiles
ADD CONSTRAINT valid_account_type 
CHECK (account_type IN ('free', 'premium'));

-- Add check constraint for tokens
ALTER TABLE profiles
ADD CONSTRAINT valid_tokens 
CHECK (tokens >= 0);