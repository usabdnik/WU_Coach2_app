-- ============================================================================
-- WU Coach 2 - Initial Database Schema
-- Feature: 004-supabase-migration
-- Created: 2025-11-10
-- Description: Creates tables for athletes, exercises, goals, and performances
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: athletes
-- Description: Student records with performance tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    group_name TEXT,
    season TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for athletes
CREATE INDEX IF NOT EXISTS idx_athletes_name ON public.athletes(name);
CREATE INDEX IF NOT EXISTS idx_athletes_group ON public.athletes(group_name);
CREATE INDEX IF NOT EXISTS idx_athletes_season ON public.athletes(season);
CREATE INDEX IF NOT EXISTS idx_athletes_status ON public.athletes(status);

-- ============================================================================
-- Table: exercises
-- Description: Exercise definitions with categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'count',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for exercises
CREATE INDEX IF NOT EXISTS idx_exercises_name ON public.exercises(name);
CREATE INDEX IF NOT EXISTS idx_exercises_type ON public.exercises(type);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);

-- ============================================================================
-- Table: goals
-- Description: Target performance values for athlete-exercise combinations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    target_value NUMERIC NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for goals
CREATE INDEX IF NOT EXISTS idx_goals_athlete ON public.goals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_goals_exercise ON public.goals(exercise_id);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON public.goals(completed);
CREATE INDEX IF NOT EXISTS idx_goals_dates ON public.goals(start_date, end_date);

-- ============================================================================
-- Table: performances
-- Description: Historical performance records
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.performances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    recorded_at DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performances
CREATE INDEX IF NOT EXISTS idx_performances_athlete ON public.performances(athlete_id);
CREATE INDEX IF NOT EXISTS idx_performances_exercise ON public.performances(exercise_id);
CREATE INDEX IF NOT EXISTS idx_performances_date ON public.performances(recorded_at);
CREATE INDEX IF NOT EXISTS idx_performances_athlete_exercise ON public.performances(athlete_id, exercise_id);

-- ============================================================================
-- Triggers: Auto-update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_athletes_updated_at ON public.athletes;
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON public.athletes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exercises_updated_at ON public.exercises;
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_performances_updated_at ON public.performances;
CREATE TRIGGER update_performances_updated_at BEFORE UPDATE ON public.performances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS (Row Level Security) Policies - MVP: Allow all for anon role
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performances ENABLE ROW LEVEL SECURITY;

-- Athletes policies (allow all for anon)
CREATE POLICY "Enable read access for all users" ON public.athletes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.athletes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.athletes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.athletes
    FOR DELETE USING (true);

-- Exercises policies (allow all for anon)
CREATE POLICY "Enable read access for all users" ON public.exercises
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.exercises
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.exercises
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.exercises
    FOR DELETE USING (true);

-- Goals policies (allow all for anon)
CREATE POLICY "Enable read access for all users" ON public.goals
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.goals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.goals
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.goals
    FOR DELETE USING (true);

-- Performances policies (allow all for anon)
CREATE POLICY "Enable read access for all users" ON public.performances
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.performances
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.performances
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.performances
    FOR DELETE USING (true);

-- ============================================================================
-- Grant permissions to anon and authenticated roles
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- Initial test data (optional - comment out if not needed)
-- ============================================================================

-- Test exercise
INSERT INTO public.exercises (name, type, category, unit)
VALUES ('Test Exercise', 'strength', 'upper_body', 'reps')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Function: save_athlete_with_validation
-- Description: Save or update athlete with data validation (used by CRM import)
-- ============================================================================
CREATE OR REPLACE FUNCTION save_athlete_with_validation(p_athlete_data JSON)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  athlete_id UUID;
  athlete_name TEXT;
  athlete_group TEXT;
  athlete_status TEXT;
BEGIN
  -- Extract fields from JSON
  athlete_name := p_athlete_data->>'name';
  athlete_group := p_athlete_data->>'group';
  athlete_status := COALESCE(p_athlete_data->>'status', 'active');

  -- Validate name
  IF athlete_name IS NULL OR TRIM(athlete_name) = '' THEN
    RAISE EXCEPTION 'Athlete name is required';
  END IF;

  -- Validate group (optional - any value allowed)
  -- Groups from Moyklass can vary, so no strict validation

  -- Check if athlete exists by name (for idempotency)
  SELECT id INTO athlete_id
  FROM athletes
  WHERE name = athlete_name
  LIMIT 1;

  IF athlete_id IS NOT NULL THEN
    -- Update existing athlete
    UPDATE athletes
    SET
      group_name = athlete_group,
      status = athlete_status,
      updated_at = NOW()
    WHERE id = athlete_id;
  ELSE
    -- Insert new athlete
    INSERT INTO athletes (
      id,
      name,
      group_name,
      status,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      athlete_name,
      athlete_group,
      athlete_status,
      NOW(),
      NOW()
    )
    RETURNING id INTO athlete_id;
  END IF;

  RETURN athlete_id;
END;
$$;

-- ============================================================================
-- Schema complete! Next steps:
-- 1. Verify tables created: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- 2. Test insert: INSERT INTO athletes (name, group_name) VALUES ('Test Athlete', 'Group A');
-- 3. Test query: SELECT * FROM athletes;
-- ============================================================================
