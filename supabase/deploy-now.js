#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));

import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '..', 'migration', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Read SQL file
const sqlPath = join(__dirname, 'deploy-function.sql');
const sql = readFileSync(sqlPath, 'utf8');

console.log('🚀 Deploying function to Supabase...\n');

// Execute SQL via PostgREST
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
  // Try direct database connection via pg_net or postgres http endpoint
  console.log('⚠️  RPC not available, trying direct SQL execution...\n');

  // Use Supabase SQL execution endpoint (if available)
  const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sql',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: sql
  });

  if (!directResponse.ok) {
    console.error('❌ Failed to deploy function');
    console.error('Response:', await directResponse.text());
    console.error('\n⚠️  Please deploy manually:');
    console.error('1. Go to: https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new');
    console.error('2. Copy content from: supabase/deploy-function.sql');
    console.error('3. Run SQL');
    process.exit(1);
  }
}

console.log('✅ Function deployed successfully!\n');
console.log('🧪 Testing function...');

// Test function with simple query
const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/save_athlete_with_validation`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
  },
  body: JSON.stringify({
    p_athlete_data: {
      name: 'Test Deployment',
      group: 'Начинающие',
      status: 'active'
    }
  })
});

if (testResponse.ok) {
  const result = await testResponse.json();
  console.log('✅ Test passed! Athlete ID:', result);
  console.log('\n🎉 Ready to run CRM import!');
} else {
  console.error('⚠️  Test failed:', await testResponse.text());
  console.log('\nFunction might be deployed but not accessible via RPC');
  console.log('Try running: node ../migration/import-from-moyklass.js');
}
