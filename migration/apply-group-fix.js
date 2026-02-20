#!/usr/bin/env node

/**
 * Apply group_name fix to save_athlete_with_validation function
 * This ensures groups are NOT overwritten by Moyklass CRM sync
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyFix() {
  try {
    console.log('✅ Connected to Supabase');

    // Read SQL file
    const sql = readFileSync('supabase/migrations/20251111000001_deploy_save_athlete_function.sql', 'utf8');

    console.log('🔄 Applying function update...');

    // Execute raw SQL via Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) throw error;

    console.log('✅ Function updated successfully!');
    console.log('📋 Now group_name will NOT be overwritten by CRM sync');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💡 Trying alternative method...');

    // Alternative: Execute SQL directly
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

    const { error: directError } = await supabase.rpc('query', { query_text: sql });

    if (directError) {
      console.error('❌ Direct method failed:', directError.message);
      console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new');
      console.log('\nSQL:\n', sql);
      process.exit(1);
    }

    console.log('✅ Function updated via alternative method!');
  }
}

applyFix();
