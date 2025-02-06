/*
  # Add exam configurations management

  1. New Tables
    - `exam_configs`
      - `id` (uuid, primary key)
      - `exam_type` (text)
      - `subjects` (jsonb array)
      - `question_types` (text array)
      - `question_patterns` (text array)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `exam_configs` table
    - Add policies for admin access
*/

-- Create exam_configs table
CREATE TABLE IF NOT EXISTS exam_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type text NOT NULL,
  subjects jsonb NOT NULL,
  question_types text[] NOT NULL,
  question_patterns text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_question_types CHECK (
    array_length(question_types, 1) > 0 AND
    question_types <@ ARRAY['MCQ', 'NUMERICAL']::text[]
  ),
  CONSTRAINT valid_question_patterns CHECK (
    array_length(question_patterns, 1) > 0 AND
    question_patterns <@ ARRAY['THEORETICAL', 'NUMERICAL']::text[]
  )
);

-- Create index for faster lookups
CREATE INDEX exam_configs_exam_type_idx ON exam_configs(exam_type);

-- Enable RLS
ALTER TABLE exam_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow read access to all users"
  ON exam_configs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin to insert exam configs"
  ON exam_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = '192043@nith.ac.in');

CREATE POLICY "Allow admin to update exam configs"
  ON exam_configs
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = '192043@nith.ac.in');

CREATE POLICY "Allow admin to delete exam configs"
  ON exam_configs
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = '192043@nith.ac.in');

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_exam_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exam_configs_timestamp
  BEFORE UPDATE ON exam_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_configs_updated_at();

-- Insert initial exam configurations
INSERT INTO exam_configs (exam_type, subjects, question_types, question_patterns) VALUES
(
  'NEET',
  '[
    {"id": "physics", "name": "Physics"},
    {"id": "chemistry", "name": "Chemistry"},
    {"id": "biology", "name": "Biology"}
  ]'::jsonb,
  ARRAY['MCQ', 'NUMERICAL'],
  ARRAY['THEORETICAL', 'NUMERICAL']
),
(
  'JEE_MAINS',
  '[
    {"id": "physics", "name": "Physics"},
    {"id": "chemistry", "name": "Chemistry"},
    {"id": "mathematics", "name": "Mathematics"}
  ]'::jsonb,
  ARRAY['MCQ', 'NUMERICAL'],
  ARRAY['THEORETICAL', 'NUMERICAL']
),
(
  'GATE',
  '[
    {"id": "engineering-mathematics", "name": "Engineering Mathematics"},
    {"id": "computer-science", "name": "Computer Science"},
    {"id": "digital-logic", "name": "Digital Logic"}
  ]'::jsonb,
  ARRAY['MCQ', 'NUMERICAL'],
  ARRAY['THEORETICAL', 'NUMERICAL']
),
(
  'CAT',
  '[
    {"id": "quantitative-aptitude", "name": "Quantitative Aptitude"},
    {"id": "verbal-ability", "name": "Verbal Ability"},
    {"id": "data-interpretation", "name": "Data Interpretation"}
  ]'::jsonb,
  ARRAY['MCQ', 'NUMERICAL'],
  ARRAY['THEORETICAL', 'NUMERICAL']
);