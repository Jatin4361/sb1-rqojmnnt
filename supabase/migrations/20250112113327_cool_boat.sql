/*
  # Fix FAQ RLS Policies

  1. Changes
    - Drop existing policies
    - Create new policies for each operation type
    - Ensure admin can perform all operations
    - Allow all authenticated users to read FAQs

  2. Security
    - Only admin can modify FAQs
    - All authenticated users can read FAQs
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to all users" ON faqs;
DROP POLICY IF EXISTS "Allow write access to admin only" ON faqs;

-- Create separate policies for each operation
CREATE POLICY "Allow read access to all users"
  ON faqs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin to insert FAQs"
  ON faqs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = '192043@nith.ac.in');

CREATE POLICY "Allow admin to update FAQs"
  ON faqs
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = '192043@nith.ac.in');

CREATE POLICY "Allow admin to delete FAQs"
  ON faqs
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = '192043@nith.ac.in');