/*
  # Fix Token Transfer System

  1. New Functions
    - `update_user_tokens`: Securely updates a user's token balance
    - Includes validation and error handling
  
  2. Security
    - Function runs with SECURITY DEFINER to access auth schema
    - Restricted to admin user only
*/

-- Create function to update user tokens
CREATE OR REPLACE FUNCTION update_user_tokens(
  email_input text,
  new_token_amount integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  current_tokens integer;
  admin_email text;
BEGIN
  -- Get admin email from JWT
  admin_email := auth.jwt() ->> 'email';
  
  -- Check if caller is admin
  IF admin_email != '192043@nith.ac.in' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Only admin can update tokens'
    );
  END IF;

  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = email_input;

  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Update tokens
  UPDATE profiles
  SET tokens = new_token_amount
  WHERE id = target_user_id
  RETURNING tokens INTO current_tokens;

  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'new_token_amount', current_tokens
  );
END;
$$;