-- Migration: Add score field to exercises table
-- Purpose: Store point value for each exercise/element from Google Sheets
-- Date: 2025-11-16

-- Add score column
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 1;

-- Add comment
COMMENT ON COLUMN public.exercises.score IS 'Point value for exercise (Балл from Google Sheets)';

-- Create index for score-based queries
CREATE INDEX IF NOT EXISTS idx_exercises_score ON public.exercises(score);

-- Log migration
DO $$
BEGIN
    RAISE NOTICE '✅ Added score column to exercises table';
END $$;
