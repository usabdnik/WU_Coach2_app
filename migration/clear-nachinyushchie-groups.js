#!/usr/bin/env node

/**
 * Clear "Начинающие" group for all athletes
 *
 * ПРОБЛЕМА: GitHub Actions использовал старую версию скрипта
 * которая устанавливала group: 'Начинающие' для всех спортсменов
 *
 * РЕШЕНИЕ: Устанавливаем NULL для всех "Начинающие" чтобы
 * группы можно было установить вручную
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mjkssesvhowmncyctmvs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function clearNachinyushchieGroups() {
  console.log('🔍 Checking athletes with group "Начинающие"...\n');

  // 1. Count athletes with "Начинающие"
  const { data: athletes, error: fetchError } = await supabase
    .from('athletes')
    .select('id, name, group_name')
    .eq('group_name', 'Начинающие');

  if (fetchError) {
    console.error('❌ Error fetching athletes:', fetchError);
    process.exit(1);
  }

  console.log(`📊 Found ${athletes.length} athletes with group "Начинающие"\n`);

  if (athletes.length === 0) {
    console.log('✅ No athletes to update');
    return;
  }

  // 2. Show first 10 examples
  console.log('📋 Examples (first 10):');
  athletes.slice(0, 10).forEach(a => {
    console.log(`  - ${a.name}`);
  });
  console.log('');

  // 3. Confirm update
  console.log('⚠️  About to set group_name = NULL for all these athletes');
  console.log('   This will allow manual group assignment\n');

  // 4. Update all to NULL
  const { error: updateError } = await supabase
    .from('athletes')
    .update({ group_name: null })
    .eq('group_name', 'Начинающие');

  if (updateError) {
    console.error('❌ Error updating athletes:', updateError);
    process.exit(1);
  }

  console.log(`✅ Successfully cleared "Начинающие" for ${athletes.length} athletes`);
  console.log('📝 Groups can now be assigned manually through the app\n');

  // 5. Verify
  const { data: remaining, error: verifyError } = await supabase
    .from('athletes')
    .select('id')
    .eq('group_name', 'Начинающие');

  if (verifyError) {
    console.error('⚠️  Could not verify:', verifyError);
    return;
  }

  if (remaining && remaining.length > 0) {
    console.error(`⚠️  Warning: ${remaining.length} athletes still have "Начинающие"`);
  } else {
    console.log('✅ Verification: No athletes with "Начинающие" remaining');
  }
}

console.log('🚀 Clear "Начинающие" Groups Script\n');
clearNachinyushchieGroups();
