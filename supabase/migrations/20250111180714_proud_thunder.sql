/*
  # Add saved questions table

  1. New Tables
    - `saved_questions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `exam_type` (text)
      - `subject` (text)
      - `question_text` (text)
      - `question_type` (text)
      - `options` (text[])
      - `correct_answer` (text)
      - `explanation` (text)
      - `difficulty` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `saved_questions` table
    - Add policies for users to manage their saved questions
*/

CREATE TABLE IF NOT EXISTS saved_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  exam_type text NOT NULL,
  subject text NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL,
  options text[],
  correct_answer text NOT NULL,
  explanation text,
  difficulty text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved questions"
  ON saved_questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved questions"
  ON saved_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved questions"
  ON saved_questions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);