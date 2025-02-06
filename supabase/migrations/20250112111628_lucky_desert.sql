/*
  # Add function to get user ID by email

  1. New Functions
    - `get_user_id_by_email`: Safely retrieves a user's ID from auth.users by email
  
  2. Security
    - Function runs with SECURITY DEFINER to access auth schema
    - Limited to authenticated users
*/

-- Create a function to safely get user ID by email
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = email_input;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_by_email TO authenticated;