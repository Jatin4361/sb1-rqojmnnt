-- Drop the existing view
DROP VIEW IF EXISTS auth_users_view;

-- Create a new view with proper schema reference
CREATE OR REPLACE VIEW auth_users_view AS
SELECT id, email, email_confirmed_at, last_sign_in_at
FROM auth.users;

-- Grant access to the authenticated users
GRANT SELECT ON auth_users_view TO authenticated;

-- Create a function to safely get user email
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;