#!/usr/bin/env node

/**
 * Список спортсменов с данными за сентябрь-октябрь 2025
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
  console.error('❌ Credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listAthletes() {
  console.log('📋 Список спортсменов с данными за сентябрь-октябрь 2025\n');

  // Получаем всех спортсменов с данными за сентябрь-октябрь
  const { data, error } = await supabase
    .from('performances')
    .select('athlete_id, athletes(id, name, group_name)')
    .gte('recorded_at', '2025-09-01')
    .lte('recorded_at', '2025-10-31');

  if (error) {
    console.error('❌ Ошибка:', error.message);
    return;
  }

  // Уникальные спортсмены
  const uniqueAthletes = new Map();
  data.forEach(d => {
    if (d.athletes) {
      uniqueAthletes.set(d.athletes.id, d.athletes);
    }
  });

  // Сортируем по группам
  const sorted = Array.from(uniqueAthletes.values()).sort((a, b) => {
    if (a.group_name === b.group_name) {
      return a.name.localeCompare(b.name, 'ru');
    }
    return (a.group_name || '').localeCompare(b.group_name || '', 'ru');
  });

  console.log(`Всего спортсменов: ${sorted.length}\n`);

  let currentGroup = '';
  sorted.forEach(athlete => {
    if (athlete.group_name !== currentGroup) {
      currentGroup = athlete.group_name;
      console.log(`\n--- ${currentGroup || 'Без группы'} ---`);
    }
    console.log(`   ${athlete.name}`);
  });
}

listAthletes().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
