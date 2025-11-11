#!/usr/bin/env node

/**
 * Deploy Postgres Function to Supabase
 * Applies the save_athlete_with_validation function
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../migration/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mjkssesvhowmncyctmvs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read SQL file
const sqlPath = join(dirname(fileURLToPath(import.meta.url)), 'deploy-function.sql');
const sql = readFileSync(sqlPath, 'utf8');

console.log('🚀 Deploying function to Supabase...\n');
console.log('📝 SQL:\n' + sql.split('\n').slice(0, 5).join('\n') + '\n...\n');

// Execute SQL
const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
  // If exec_sql doesn't exist, try direct query
  const { data: pg } = await supabase.from('_pg_stat_statements').select('*').limit(0);

  // Use raw SQL through PostgREST
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
});

if (error) {
  console.error('❌ Error deploying function:', error.message);
  console.error('\n⚠️  Please deploy manually:');
  console.error('1. Go to: https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new');
  console.error('2. Copy content from: supabase/deploy-function.sql');
  console.error('3. Run SQL');
  process.exit(1);
}

console.log('✅ Function deployed successfully!');
console.log('\n🧪 Testing function...');

// Test function
const testData = {
  name: 'Test Import',
  group: 'Начинающие',
  status: 'active'
};

const { data: testResult, error: testError } = await supabase.rpc('save_athlete_with_validation', {
  p_athlete_data: testData
});

if (testError) {
  console.error('❌ Test failed:', testError.message);
  process.exit(1);
}

console.log('✅ Test passed! Athlete ID:', testResult);
console.log('\n🎉 Ready to run CRM import!');
