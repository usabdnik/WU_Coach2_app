#!/usr/bin/env node

/**
 * Проверка существующих данных за сентябрь-ноябрь 2024
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL или SUPABASE_SERVICE_KEY не найдены в .env');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkData() {
  console.log('🔍 Проверка существующих данных за сентябрь-ноябрь 2025\n');

  // Проверяем данные за сентябрь, октябрь, ноябрь 2025
  const { data, error } = await supabase
    .from('performances')
    .select('id, athlete_id, exercise_id, value, recorded_at, athletes(name), exercises(name)')
    .gte('recorded_at', '2025-09-01')
    .lte('recorded_at', '2025-11-30')
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('❌ Ошибка:', error.message);
    return;
  }

  console.log(`📊 Всего записей за сентябрь-ноябрь 2025: ${data.length}\n`);

  // Группируем по месяцам
  const september = data.filter(d => d.recorded_at.startsWith('2025-09'));
  const october = data.filter(d => d.recorded_at.startsWith('2025-10'));
  const november = data.filter(d => d.recorded_at.startsWith('2025-11'));

  console.log(`Сентябрь: ${september.length} записей`);
  if (september.length > 0) {
    console.log(`   Пример: ${september[0].athletes?.name} - ${september[0].exercises?.name}: ${september[0].value}`);
  }

  console.log(`\nОктябрь: ${october.length} записей`);
  if (october.length > 0) {
    console.log(`   Пример: ${october[0].athletes?.name} - ${october[0].exercises?.name}: ${october[0].value}`);
  }

  console.log(`\nНоябрь: ${november.length} записей`);
  if (november.length > 0) {
    console.log(`   Пример: ${november[0].athletes?.name} - ${november[0].exercises?.name}: ${november[0].value}`);
  }

  // Уникальные спортсмены
  const uniqueAthletes = new Set(data.map(d => d.athlete_id));
  console.log(`\n👥 Уникальных спортсменов: ${uniqueAthletes.size}`);
}

checkData().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
