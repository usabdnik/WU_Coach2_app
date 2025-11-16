/**
 * Add base exercises required by PWA
 *
 * These are the 3 core exercises for performance tracking:
 * - Подтягивания (Pull-ups)
 * - Отжимания от пола (Push-ups)
 * - Отжимания от брусьев (Dips)
 *
 * Usage: node migration/add-base-exercises.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BASE_EXERCISES = [
  {
    name: 'Подтягивания',
    type: 'Силовое',
    category: 'strength',
    unit: 'count',
    score: null
  },
  {
    name: 'Отжимания от пола',
    type: 'Силовое',
    category: 'strength',
    unit: 'count',
    score: null
  },
  {
    name: 'Отжимания от брусьев',
    type: 'Силовое',
    category: 'strength',
    unit: 'count',
    score: null
  }
];

async function main() {
  console.log('🎯 Добавление базовых упражнений для PWA...\n');

  for (const exercise of BASE_EXERCISES) {
    // Check if exists
    const { data: existing } = await supabase
      .from('exercises')
      .select('id, name')
      .eq('name', exercise.name)
      .single();

    if (existing) {
      console.log(`  ⏭️  ${exercise.name} уже существует (ID: ${existing.id})`);
      continue;
    }

    // Insert new exercise
    const { data, error } = await supabase
      .from('exercises')
      .insert(exercise)
      .select()
      .single();

    if (error) {
      console.error(`  ❌ ${exercise.name}: ОШИБКА - ${error.message}`);
    } else {
      console.log(`  ✅ ${exercise.name} добавлено (ID: ${data.id})`);
    }
  }

  console.log('\n📊 Проверка результата:');

  // Verify all three exist
  const pwaNeedsExercises = ['Подтягивания', 'Отжимания от пола', 'Отжимания от брусьев'];

  for (const name of pwaNeedsExercises) {
    const { data } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', name)
      .single();

    if (data) {
      console.log(`  ✅ ${name}: ${data.id}`);
    } else {
      console.log(`  ❌ ${name}: НЕ НАЙДЕНО`);
    }
  }

  console.log('\n✅ Базовые упражнения добавлены!');
  console.log('   Теперь PWA сможет сохранять performances.');
}

main().catch(console.error);
