/*
  # Add FAQ Management Table

  1. New Tables
    - `faqs`
      - `id` (uuid, primary key)
      - `question` (text)
      - `answer` (text)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `faqs` table
    - Add policies for admin access
*/

-- Create FAQ table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow read access to all users"
  ON faqs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow write access to admin only"
  ON faqs
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = '192043@nith.ac.in')
  WITH CHECK (auth.jwt() ->> 'email' = '192043@nith.ac.in');