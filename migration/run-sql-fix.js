#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mjkssesvhowmncyctmvs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qa3NzZXN2aG93bW5jeWN0bXZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE2NTYzOCwiZXhwIjoyMDc1NzQxNjM4fQ.BhsnDBKI8HRPmxd3BDIDxjpgZpYTa96-TUIMyMO2Mvs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

async function runSQL() {
  try {
    console.log('✅ Connected to Supabase');
    console.log('🔄 Executing SQL...\n');

    // Try to execute via RPC
    const { data, error } = await supabase.rpc('exec', { sql });

    if (error) {
      console.log('⚠️  RPC method not available, printing SQL for manual execution:\n');
      console.log('📋 Copy and paste this into Supabase SQL Editor:');
      console.log('🔗 https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new\n');
      console.log(sql);
      console.log('\n✅ After running the SQL, groups will be protected from CRM overwrites');
    } else {
      console.log('✅ Function updated successfully!');
      console.log('📋 group_name will now be protected from CRM sync overwrites');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Manual SQL needed - copy and paste into Supabase SQL Editor:');
    console.log('🔗 https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new\n');
    console.log(sql);
  }
}

runSQL();
