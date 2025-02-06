-- Drop existing constraints and make options nullable
DO $$ 
BEGIN
  -- First drop any existing constraints that might conflict
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_question_options'
    AND table_name = 'master_questions'
  ) THEN
    ALTER TABLE master_questions DROP CONSTRAINT valid_question_options;
  END IF;

  -- Make options nullable if it's not already
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'master_questions' 
    AND column_name = 'options' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE master_questions ALTER COLUMN options DROP NOT NULL;
  END IF;
END $$;

-- Add comprehensive check constraint
ALTER TABLE master_questions
ADD CONSTRAINT valid_question_options
CHECK (
  (
    question_type = 'MCQ' AND 
    options IS NOT NULL AND 
    array_length(options, 1) = 4 AND
    array_position(options, '') IS NULL  -- Ensure no empty strings
  ) OR (
    question_type = 'NUMERICAL' AND 
    (options IS NULL OR array_length(options, 1) = 0)
  )
);

-- Update column comments
COMMENT ON COLUMN master_questions.options IS 'Array of 4 options for MCQ questions, NULL or empty array for numerical questions';
COMMENT ON COLUMN master_questions.question_type IS 'Type of question: MCQ or NUMERICAL';