-- First drop any existing constraints that might conflict
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_question_options'
        AND table_name = 'master_questions'
    ) THEN
        ALTER TABLE master_questions DROP CONSTRAINT valid_question_options;
    END IF;
END $$;

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