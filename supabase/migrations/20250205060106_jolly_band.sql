/*
  # Update master_questions table for better question type handling

  1. Changes
    - Make options column nullable to support numerical questions
    - Add check constraint for question_type and options combination
    - Add validation to ensure MCQ questions have options and numerical questions don't

  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Allow options to be null for numerical questions
ALTER TABLE master_questions
ALTER COLUMN options DROP NOT NULL;

-- Add check constraint to ensure proper options based on question_type
ALTER TABLE master_questions
ADD CONSTRAINT valid_question_options
CHECK (
  (question_type = 'MCQ' AND options IS NOT NULL AND array_length(options, 1) = 4) OR
  (question_type = 'NUMERICAL' AND (options IS NULL OR array_length(options, 1) = 0))
);

-- Add comment explaining the options column
COMMENT ON COLUMN master_questions.options IS 'Array of 4 options for MCQ questions, NULL or empty array for numerical questions';