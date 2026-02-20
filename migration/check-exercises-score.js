/**
 * Check exercises with score field
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkExercises() {
  console.log('🔍 Проверка упражнений в Supabase...\n');

  // Fetch all exercises
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, type, score')
    .order('score', { ascending: true })
    .limit(20);

  if (error) {
    console.error('❌ Ошибка:', error.message);
    return;
  }

  console.log(`📊 Найдено упражнений: ${exercises.length}\n`);
  console.log('📋 Первые 20 упражнений (отсортированы по баллам):\n');

  exercises.forEach((ex, i) => {
    const typeLabel = ex.type?.toLowerCase().includes('статик') ? '(С)' : 
                      ex.type?.toLowerCase().includes('динамик') ? '(Д)' : '(?)';
    console.log(`${i + 1}. ${ex.name} ${typeLabel} ${ex.score || 0}`);
  });

  // Statistics
  const withScore = exercises.filter(e => e.score && e.score > 0).length;
  const withoutScore = exercises.filter(e => !e.score || e.score === 0).length;

  console.log(`\n📊 Статистика:`);
  console.log(`   С баллами: ${withScore}`);
  console.log(`   Без баллов: ${withoutScore}`);
}

checkExercises();
