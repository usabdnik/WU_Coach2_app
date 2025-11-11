-- Deploy save_athlete_with_validation function to Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new

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
