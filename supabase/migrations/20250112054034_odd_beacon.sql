/*
  # Create master questions table

  1. New Tables
    - `master_questions`
      - `id` (uuid, primary key)
      - `exam_type` (text, not null)
      - `subject` (text, not null)
      - `question_text` (text, not null)
      - `question_type` (text, not null)
      - `question_pattern` (text, not null)
      - `difficulty` (text, not null)
      - `options` (text array, for MCQ questions)
      - `correct_answer` (text, not null)
      - `explanation` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)
      - `usage_count` (integer, tracks how many times the question was generated)

  2. Security
    - Enable RLS on `master_questions` table
    - Add policies for authenticated users to read questions
    - Add policies for system to insert questions
*/

CREATE TABLE IF NOT EXISTS master_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type text NOT NULL,
  subject text NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL,
  question_pattern text NOT NULL,
  difficulty text NOT NULL,
  options text[],
  correct_answer text NOT NULL,
  explanation text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users,
  usage_count integer DEFAULT 1,
  CONSTRAINT valid_question_type CHECK (question_type IN ('MCQ', 'NUMERICAL')),
  CONSTRAINT valid_question_pattern CHECK (question_pattern IN ('THEORETICAL', 'NUMERICAL')),
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'))
);

-- Create index on commonly queried fields
CREATE INDEX IF NOT EXISTS master_questions_exam_subject_idx 
ON master_questions(exam_type, subject);

CREATE INDEX IF NOT EXISTS master_questions_type_pattern_idx 
ON master_questions(question_type, question_pattern);

-- Enable RLS
ALTER TABLE master_questions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read questions
CREATE POLICY "Users can read master questions"
  ON master_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow system to insert questions (will be handled through server-side functions)
CREATE POLICY "System can insert master questions"
  ON master_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create unique constraint to prevent duplicate questions
CREATE UNIQUE INDEX IF NOT EXISTS unique_question_text 
ON master_questions(md5(lower(question_text)));

-- Function to update usage count
CREATE OR REPLACE FUNCTION increment_question_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE master_questions
  SET usage_count = usage_count + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage count when question is used
CREATE TRIGGER update_question_usage
  AFTER INSERT ON saved_questions
  FOR EACH ROW
  EXECUTE FUNCTION increment_question_usage();