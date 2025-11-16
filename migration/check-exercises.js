/**
 * Check exercises in Supabase
 * Usage: node migration/check-exercises.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log('🔍 Проверяю exercises в Supabase...\n');

  // Get total count
  const { count } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Всего exercises: ${count}\n`);

  // Search for specific exercises PWA needs
  const pwaNeedsExercises = ['Подтягивания', 'Отжимания от пола', 'Отжимания от брусьев'];

  console.log('🎯 Поиск упражнений необходимых для PWA:');
  for (const name of pwaNeedsExercises) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name')
      .eq('name', name);

    if (error) {
      console.log(`  ❌ ${name}: ОШИБКА - ${error.message}`);
    } else if (data.length === 0) {
      console.log(`  ❌ ${name}: НЕ НАЙДЕНО`);
    } else {
      console.log(`  ✅ ${name}: ${data[0].id}`);
    }
  }

  // Show sample of actual exercises
  console.log('\n📋 Первые 10 exercises в базе:');
  const { data: samples } = await supabase
    .from('exercises')
    .select('name, type, category')
    .limit(10);

  samples.forEach((ex, i) => {
    console.log(`  ${i + 1}. ${ex.name} | type: ${ex.type || 'null'} | category: ${ex.category || 'null'}`);
  });

  // Check for performance data
  console.log('\n📈 Проверка performances:');
  const { count: perfCount } = await supabase
    .from('performances')
    .select('*', { count: 'exact', head: true });

  console.log(`  Всего performances: ${perfCount}`);
}

main().catch(console.error);
