#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.supabase' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('athletes')
  .select('id, name, group_name')
  .order('name');

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('Total athletes:', data.length);
console.log('\nAthletes by group:');
const byGroup = {};
data.forEach(a => {
  const g = a.group_name || 'No group';
  if (!byGroup[g]) byGroup[g] = [];
  byGroup[g].push(a.name);
});
Object.keys(byGroup).sort().forEach(g => {
  console.log(`\n${g} (${byGroup[g].length}):`);
  byGroup[g].forEach(n => console.log(`  - ${n}`));
});
