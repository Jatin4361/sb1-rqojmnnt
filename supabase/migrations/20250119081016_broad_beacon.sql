/*
  # Add topic column to master_questions table

  1. Changes
    - Add topic column to master_questions table
    - Create index on topic column for better query performance
    - Add column description

  2. Notes
    - Topic is optional, so it can be null
    - Index helps with filtering by topic
*/

-- Add topic column
ALTER TABLE master_questions 
ADD COLUMN IF NOT EXISTS topic text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS master_questions_topic_idx 
ON master_questions(topic);

-- Add column description
COMMENT ON COLUMN master_questions.topic IS 'Specific topic or chapter within the subject';