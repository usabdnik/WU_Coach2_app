-- Migration: Add schedule, rank_start, rank_end, rank_history columns to athletes table
-- Feature: 005-schedule-rank-subscription
-- Date: 2025-11-11
-- Description: Extends athletes table to support schedule management, subscription tracking, and athletic rank recording

-- Add new columns to athletes table
ALTER TABLE public.athletes
    ADD COLUMN IF NOT EXISTS schedule TEXT NULL,
    ADD COLUMN IF NOT EXISTS rank_start TEXT NULL,
    ADD COLUMN IF NOT EXISTS rank_end TEXT NULL,
    ADD COLUMN IF NOT EXISTS rank_history JSONB NULL DEFAULT '[]'::jsonb;

-- Add column comments for documentation
COMMENT ON COLUMN public.athletes.schedule IS
    'Athlete attendance schedule. Format: "День ЧЧ:ММ, День ЧЧ:ММ" (e.g., "Пн 18:00, Ср 19:00") for fixed schedule, or literal "Самозапись" for self-registration. NULL if not set.';

COMMENT ON COLUMN public.athletes.rank_start IS
    'Athletic rank at season start. Values: "III юношеский разряд", "II юношеский разряд", "I юношеский разряд", "III взрослый разряд", "II взрослый разряд", "I взрослый разряд", "КМС", "МС", "МСМК", "Без разряда". NULL if not set.';

COMMENT ON COLUMN public.athletes.rank_end IS
    'Athletic rank achieved by season end. Same values as rank_start. NULL if season not complete or not yet recorded.';

COMMENT ON COLUMN public.athletes.rank_history IS
    'Historical rank progression data across multiple seasons. Format: [{"season": "2024-2025", "rank_start": "I юношеский разряд", "rank_end": "III взрослый разряд"}]. Empty array [] if no history.';

-- Optional: Add validation constraints for data integrity (can be added later if needed)
-- Commented out for MVP to keep flexibility during initial development
/*
ALTER TABLE public.athletes
  ADD CONSTRAINT check_schedule_format
  CHECK (
    schedule IS NULL
    OR schedule = 'Самозапись'
    OR schedule ~ '^(Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2}(, (Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2})*$'
  );

ALTER TABLE public.athletes
  ADD CONSTRAINT check_rank_start_values
  CHECK (
    rank_start IS NULL
    OR rank_start IN (
      'III юношеский разряд', 'II юношеский разряд', 'I юношеский разряд',
      'III взрослый разряд', 'II взрослый разряд', 'I взрослый разряд',
      'КМС', 'МС', 'МСМК', 'Без разряда'
    )
  );

ALTER TABLE public.athletes
  ADD CONSTRAINT check_rank_end_values
  CHECK (
    rank_end IS NULL
    OR rank_end IN (
      'III юношеский разряд', 'II юношеский разряд', 'I юношеский разряд',
      'III взрослый разряд', 'II взрослый разряд', 'I взрослый разряд',
      'КМС', 'МС', 'МСМК', 'Без разряда'
    )
  );
*/
