#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.mjkssesvhowmncyctmvs:wlZbQvvlABtCcqzt@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
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
  athlete_name := p_athlete_data->>'name';
  athlete_group := p_athlete_data->>'group';
  athlete_status := COALESCE(p_athlete_data->>'status', 'active');

  IF athlete_name IS NULL OR TRIM(athlete_name) = '' THEN
    RAISE EXCEPTION 'Athlete name is required';
  END IF;

  SELECT id INTO athlete_id
  FROM athletes
  WHERE name = athlete_name
  LIMIT 1;

  IF athlete_id IS NOT NULL THEN
    UPDATE athletes
    SET
      group_name = COALESCE(athlete_group, group_name),
      status = athlete_status,
      updated_at = NOW()
    WHERE id = athlete_id;
  ELSE
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
`;

async function updateFunction() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    console.log('🔄 Updating save_athlete_with_validation function...');
    await client.query(sql);

    console.log('✅ SQL function updated!');
    console.log('📋 Now group_name preserves existing values');
    console.log('✅ CRM sync will NOT overwrite manual groups');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateFunction();
