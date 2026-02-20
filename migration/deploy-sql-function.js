#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not found');
  process.exit(1);
}

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

async function deployFunction() {
  try {
    console.log('✅ Supabase client initialized\n');
    console.log('🔄 Deploying SQL function via Management API...\n');

    // Use Supabase Management API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log('✅ Function deployed successfully!\n');
    console.log('📋 Changes:');
    console.log('  - group_name = COALESCE(athlete_group, group_name)');
    console.log('  - Groups will NOT be overwritten by CRM sync\n');
    console.log('✅ Manual groups are now protected!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Using Supabase SQL Editor method...\n');
    console.log('📋 Open: https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new');
    console.log('📋 Paste and run this SQL:\n');
    console.log(sql);
  }
}

deployFunction();
