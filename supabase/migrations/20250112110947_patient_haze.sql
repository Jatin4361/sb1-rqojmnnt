-- Create a view to safely access auth.users data
CREATE OR REPLACE VIEW auth_users_view AS
SELECT id, email, email_confirmed_at, last_sign_in_at
FROM auth.users;

-- Grant access to the authenticated users
GRANT SELECT ON auth_users_view TO authenticated;