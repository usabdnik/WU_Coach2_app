#!/usr/bin/env node

/**
 * Дополнение недостающих данных за сентябрь и октябрь 2025
 *
 * ЛОГИКА:
 * - Проверяет наличие данных у каждого спортсмена за сентябрь/октябрь
 * - Добавляет данные ТОЛЬКО если их нет
 * - Пропускает спортсменов с существующими данными
 * - НЕ удаляет и НЕ перезаписывает ничего
 * - Сохраняет все данные за ноябрь
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
console.log('✅ Supabase client initialized\n');

// ============================================
// DATA: September 2025
// ============================================

const SEPTEMBER_2025 = [
  // А-218
  { lastName: 'Владыкин', firstName: 'Лев', group: 'А-218', pullups: 5, dips: 6, pushups: null, schedule: null },
  { lastName: 'Рудин', firstName: 'Никита', group: 'А-218', pullups: 15, dips: 10, pushups: null, schedule: null },
  { lastName: 'Трудолюбов', firstName: 'Лев', group: 'А-218', pullups: 0, dips: 3, pushups: null, schedule: null },
  { lastName: 'Дубков', firstName: 'Богдан', group: 'А-218', pullups: 4, dips: 10, pushups: null, schedule: null },
  { lastName: 'Внукова', firstName: 'Софья', group: 'А-218', pullups: 0, dips: 0, pushups: 11, schedule: null },
  { lastName: 'Мотошков', firstName: 'Антон', group: 'А-218', pullups: 12, dips: 3, pushups: null, schedule: null },
  { lastName: 'Каршиев', firstName: 'Захар', group: 'А-218', pullups: 24, dips: 19, pushups: null, schedule: null },
  { lastName: 'Носкова', firstName: 'Алиса', group: 'А-218', pullups: null, dips: null, pushups: 15, schedule: null },

  // А-219
  { lastName: 'Вежеев', firstName: 'Андрей', group: 'А-219', pullups: 10, dips: 16, pushups: null, schedule: null },
  { lastName: 'Киселев', firstName: 'Святослав', group: 'А-219', pullups: 4, dips: 6, pushups: null, schedule: null },

  // М-19
  { lastName: 'Мнацаканян', firstName: 'Марк', group: 'М-19', pullups: 6, dips: null, pushups: null, schedule: null },
  { lastName: 'Байгозин', firstName: null, group: 'М-19', pullups: 16, dips: 30, pushups: null, schedule: null },
  { lastName: 'Бобылев', firstName: null, group: 'М-19', pullups: 16, dips: 15, pushups: null, schedule: null },
  { lastName: 'Дулесов', firstName: null, group: 'М-19', pullups: 15, dips: 16, pushups: null, schedule: null },
  { lastName: 'Хайдаров', firstName: null, group: 'М-19', pullups: 10, dips: 14, pushups: null, schedule: null },

  // М-117
  { lastName: 'Балобанов', firstName: null, group: 'М-117', pullups: 23, dips: 42, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Загребин', firstName: null, group: 'М-117', pullups: 31, dips: 60, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Кулаков', firstName: null, group: 'М-117', pullups: 10, dips: 18, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Ломаев', firstName: null, group: 'М-117', pullups: 4, dips: 9, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Какшинский', firstName: null, group: 'М-117', pullups: 12, dips: 15, pushups: null, schedule: 'Пн 17:00, Ср 17:00' },
  { lastName: 'Тумбаков', firstName: null, group: 'М-117', pullups: 11, dips: 1, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Стерхов', firstName: null, group: 'М-117', pullups: 18, dips: 20, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Хорин', firstName: null, group: 'М-117', pullups: 9, dips: 25, pushups: null, schedule: 'Ср 17:00, Пт 17:00' },
  { lastName: 'Щёкотова', firstName: 'Полина', group: 'М-117', pullups: 11, dips: 6, pushups: null, schedule: 'Пн 17:00, Ср 17:00' },
  { lastName: 'Тарасов', firstName: null, group: 'М-117', pullups: 15, dips: 16, pushups: null, schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Осеев', firstName: null, group: 'М-117', pullups: 15, dips: 20, pushups: null, schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Лебедев', firstName: null, group: 'М-117', pullups: 1, dips: 0, pushups: null, schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Романов', firstName: null, group: 'М-117', pullups: 13, dips: 21, pushups: null, schedule: null },

  // М-118
  { lastName: 'Попков', firstName: 'Константин', group: 'М-118', pullups: 4, dips: 3, pushups: null, schedule: 'Пн 9:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Чумаков', firstName: null, group: 'М-118', pullups: 4, dips: 0, pushups: null, schedule: 'Пн 9:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Зеленских', firstName: 'Степан', group: 'М-118', pullups: 12, dips: 6, pushups: null, schedule: 'вручную' },
  { lastName: 'Зеленских', firstName: 'Алексей', group: 'М-118', pullups: 5, dips: 5, pushups: null, schedule: 'вручную' },
  { lastName: 'Шайгаллямов', firstName: 'Ратмир', group: 'М-118', pullups: 6, dips: 0, pushups: null, schedule: 'Пн 18:00, Ср 18:00' },
  { lastName: 'Скобелев', firstName: null, group: 'М-118', pullups: 13, dips: 9, pushups: null, schedule: 'Пн 18:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Трескин', firstName: null, group: 'М-118', pullups: 15, dips: 15, pushups: null, schedule: 'Пн 18:00, Ср 18:00' },
  { lastName: 'Чесноков', firstName: null, group: 'М-118', pullups: 10, dips: 24, pushups: null, schedule: null },
  { lastName: 'Нурутдинов', firstName: null, group: 'М-118', pullups: 32, dips: 35, pushups: null, schedule: null },
];

// ============================================
// DATA: October 2025
// ============================================

const OCTOBER_2025 = [
  // А-29
  { lastName: 'Михеев', firstName: 'Михаил', group: 'А-29', pullups: 3, dips: 2, pushups: null, schedule: 'Вт 9:00, Чт 9:00' },
  { lastName: 'Утробин', firstName: 'Артём', group: 'А-29', pullups: 20, dips: 15, pushups: null, schedule: 'Вт 9:00, Чт 9:00' },
  { lastName: 'Финский', firstName: 'Тимофей', group: 'А-29', pullups: 0, dips: 5, pushups: null, schedule: 'Вт 9:00, Чт 9:00, Сб 18:00' },
  { lastName: 'Вахрушев', firstName: 'Михаил', group: 'А-29', pullups: 0, dips: null, pushups: 2, schedule: 'Вт 9:00, Чт 9:00' },

  // А-218
  { lastName: 'Владыкин', firstName: 'Лев', group: 'А-218', pullups: 6, dips: 10, pushups: null, schedule: null },
  { lastName: 'Рудин', firstName: 'Никита', group: 'А-218', pullups: 9, dips: 9, pushups: null, schedule: null },
  { lastName: 'Трудолюбов', firstName: 'Лев', group: 'А-218', pullups: 1, dips: null, pushups: 20, schedule: null },
  { lastName: 'Дубков', firstName: 'Богдан', group: 'А-218', pullups: 6, dips: 6, pushups: null, schedule: null },
  { lastName: 'Внукова', firstName: 'Софья', group: 'А-218', pullups: 0, dips: null, pushups: 20, schedule: null },
  { lastName: 'Мотошков', firstName: 'Антон', group: 'А-218', pullups: null, dips: null, pushups: null, schedule: null },
  { lastName: 'Богородский', firstName: 'Макар', group: 'А-218', pullups: null, dips: null, pushups: null, schedule: null },
  { lastName: 'Каршиев', firstName: 'Захар', group: 'А-218', pullups: 22, dips: 21, pushups: null, schedule: null },
  { lastName: 'Чесноков', firstName: 'Александр', group: 'А-218', pullups: 10, dips: 28, pushups: null, schedule: 'вручную' },
  { lastName: 'Носкова', firstName: 'Алиса', group: 'А-218', pullups: null, dips: null, pushups: null, schedule: null },
  { lastName: 'Вахрушев', firstName: 'Савелий', group: 'А-218', pullups: 1, dips: null, pushups: 22, schedule: 'Вт 19:00, Чт 19:00, Сб 18:00' },

  // А-219
  { lastName: 'Вежеев', firstName: 'Андрей', group: 'А-219', pullups: null, dips: null, pushups: null, schedule: null },
  { lastName: 'Киселев', firstName: 'Святослав', group: 'А-219', pullups: null, dips: null, pushups: null, schedule: null },
  { lastName: 'Новосёлов', firstName: 'Дмитрий', group: 'А-219', pullups: 4, dips: 10, pushups: null, schedule: null },
  { lastName: 'Желудов', firstName: 'Михаил', group: 'А-219', pullups: 11, dips: 15, pushups: null, schedule: null },
  { lastName: 'Колеватов', firstName: 'Иван', group: 'А-219', pullups: 12, dips: 13, pushups: null, schedule: null },

  // М-19
  { lastName: 'Мнацаканян', firstName: 'ПБ', group: 'М-19', pullups: null, dips: null, pushups: null, schedule: null },
  { lastName: 'Байгозин', firstName: null, group: 'М-19', pullups: 15, dips: 26, pushups: null, schedule: null },
  { lastName: 'Бобылев', firstName: null, group: 'М-19', pullups: 15, dips: 23, pushups: null, schedule: null },
  { lastName: 'Дулесов', firstName: null, group: 'М-19', pullups: null, dips: null, pushups: null, schedule: null },
  { lastName: 'Хайдаров', firstName: null, group: 'М-19', pullups: null, dips: null, pushups: null, schedule: null },

  // М-117
  { lastName: 'Балобанов', firstName: null, group: 'М-117', pullups: 23, dips: 46, pushups: null, schedule: null },
  { lastName: 'Загребин', firstName: null, group: 'М-117', pullups: 30, dips: 53, pushups: null, schedule: null },
  { lastName: 'Кулаков', firstName: null, group: 'М-117', pullups: 10, dips: 20, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Ломаев', firstName: null, group: 'М-117', pullups: 4, dips: 12, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Какшинский', firstName: null, group: 'М-117', pullups: 10, dips: 5, pushups: null, schedule: 'Пн 17:00, Ср 17:00' },
  { lastName: 'Тумбаков', firstName: null, group: 'М-117', pullups: 10, dips: 3, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Стерхов', firstName: null, group: 'М-117', pullups: 20, dips: 30, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Хорин', firstName: null, group: 'М-117', pullups: 12, dips: 32, pushups: null, schedule: 'Ср 17:00, Пт 17:00' },
  { lastName: 'Щёкотова', firstName: 'Полина', group: 'М-117', pullups: 10, dips: 10, pushups: null, schedule: 'Пн 17:00, Ср 17:00' },
  { lastName: 'Тарасов', firstName: null, group: 'М-117', pullups: 20, dips: 22, pushups: null, schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Осеев', firstName: null, group: 'М-117', pullups: 12, dips: 30, pushups: null, schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Лебедев', firstName: null, group: 'М-117', pullups: 0, dips: 0, pushups: null, schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Романов', firstName: null, group: 'М-117', pullups: 12, dips: 30, pushups: null, schedule: null },
  { lastName: 'Касаткин', firstName: 'Ярослав', group: 'М-117', pullups: 30, dips: 43, pushups: null, schedule: 'Ср 17:00, Пт 17:00' },
  { lastName: 'Зайцев', firstName: 'Михаил', middleName: 'Васильевич', group: 'М-117', pullups: 6, dips: 10, pushups: null, schedule: 'Пн 17:00, Ср 17:00' },
  { lastName: 'Ризванов', firstName: 'Д', group: 'М-117', pullups: null, dips: null, pushups: null, schedule: 'Ср 17:00, Пт 17:00' },
  { lastName: 'Клементьев', firstName: null, group: 'М-117', pullups: 10, dips: 13, pushups: null, schedule: 'разовые' },
  { lastName: 'Васильев', firstName: null, group: 'М-117', pullups: null, dips: null, pushups: null, schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Логинов', firstName: null, group: 'М-117', pullups: 24, dips: 50, pushups: null, schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Коновалов', firstName: null, group: 'М-117', pullups: null, dips: null, pushups: null, schedule: 'вручную' },
  { lastName: 'Поклонов', firstName: 'Егор', group: 'М-117', pullups: 13, dips: 18, pushups: null, schedule: 'Пн 17:00, Пт 17:00' },

  // М-118
  { lastName: 'Попков', firstName: 'Константин', group: 'М-118', pullups: 13, dips: 3, pushups: null, schedule: 'Пн 9:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Чумаков', firstName: 'Дмитрий', group: 'М-118', pullups: 5, dips: 7, pushups: null, schedule: 'Пн 9:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Зеленских', firstName: 'Степан', group: 'М-118', pullups: 13, dips: 12, pushups: null, schedule: 'вручную' },
  { lastName: 'Зеленских', firstName: 'Алексей', group: 'М-118', pullups: 5, dips: 10, pushups: null, schedule: 'вручную' },
  { lastName: 'Шайгаллямов', firstName: 'Ратмир', group: 'М-118', pullups: 7, dips: 1, pushups: null, schedule: 'Пн 18:00, Ср 18:00' },
  { lastName: 'Скобелев', firstName: null, group: 'М-118', pullups: 16, dips: 20, pushups: null, schedule: 'Пн 18:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Трескин', firstName: null, group: 'М-118', pullups: 17, dips: 20, pushups: null, schedule: 'Пн 18:00, Ср 18:00' },
  { lastName: 'Нурутдинов', firstName: 'А', group: 'М-118', pullups: 28, dips: 32, pushups: null, schedule: null },
  { lastName: 'Красноперов', firstName: 'Михаил', middleName: 'Евгеньевич', group: 'М-118', pullups: 7, dips: 11, pushups: null, schedule: 'Пн 18:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Самойлов', firstName: 'Роман', group: 'М-118', pullups: 0, dips: 0, pushups: null, schedule: null },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Ищет спортсмена в базе по ФИО
 * Формат имени в базе: "Фамилия Имя" или "Фамилия Имя Отчество"
 */
async function findAthlete({ lastName, firstName, middleName }) {
  // Строим паттерн для поиска
  let pattern = lastName;
  if (firstName) {
    pattern += ` ${firstName}`;
  }

  const { data, error } = await supabase
    .from('athletes')
    .select('id, name, group_name, schedule')
    .ilike('name', `${pattern}%`); // Ищем по началу имени

  if (error) {
    console.error(`❌ Error searching for ${lastName} ${firstName || ''}:`, error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn(`⚠️  Athlete not found: ${lastName} ${firstName || ''}`);
    return null;
  }

  if (data.length > 1) {
    console.warn(`⚠️  Multiple athletes found for "${pattern}%", using first match: ${data[0].name}`);
  }

  return data[0];
}

/**
 * Создаёт или обновляет performance за указанный месяц
 */
async function upsertPerformance(athleteId, exerciseName, value, month, year) {
  if (value === null || value === undefined) {
    return; // Пропускаем пустые значения
  }

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('id')
    .eq('name', exerciseName)
    .single();

  if (exerciseError || !exercise) {
    console.error(`❌ Exercise not found: ${exerciseName}`);
    return;
  }

  // Формируем дату: 15 число указанного месяца
  const recordedAt = `${year}-${String(month).padStart(2, '0')}-15`;

  // Проверяем, существует ли уже запись
  const { data: existing, error: checkError } = await supabase
    .from('performances')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('exercise_id', exercise.id)
    .eq('recorded_at', recordedAt)
    .single();

  if (existing) {
    // Обновляем существующую запись
    const { error: updateError } = await supabase
      .from('performances')
      .update({
        value: value,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error(`❌ Error updating performance:`, updateError.message);
    } else {
      console.log(`  🔄 ${exerciseName}: ${value} (обновлено)`);
    }
  } else {
    // Создаём новую запись
    const { error: insertError } = await supabase
      .from('performances')
      .insert({
        athlete_id: athleteId,
        exercise_id: exercise.id,
        value: value,
        recorded_at: recordedAt,
        notes: month === 9 ? 'Сентябрь 2025' : 'Октябрь 2025',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error(`❌ Error inserting performance:`, insertError.message);
    } else {
      console.log(`  ✅ ${exerciseName}: ${value}`);
    }
  }
}

/**
 * Обновляет schedule и group_name у спортсмена
 * ВАЖНО: НЕ устанавливает группу "Начинающие"
 */
async function updateAthleteMetadata(athleteId, group, schedule) {
  const updates = {};

  // НЕ обновляем группу если она "Начинающие" - это группа по умолчанию из CRM
  if (group && group !== 'Начинающие') {
    updates.group_name = group;
  }

  if (schedule && schedule !== 'вручную') {
    updates.schedule = schedule;
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('athletes')
    .update(updates)
    .eq('id', athleteId);

  if (error) {
    console.error(`❌ Error updating athlete metadata:`, error.message);
  } else {
    console.log(`  📋 Group: ${group || 'unchanged'}, Schedule: ${schedule || 'unchanged'}`);
  }
}

// ============================================
// MAIN IMPORT FUNCTION
// ============================================

async function importMonthData(dataSet, month, year) {
  console.log(`\n🔄 Importing ${month} ${year}...\n`);

  let imported = 0;
  let notFound = 0;
  let skipped = 0;

  for (const entry of dataSet) {
    const athlete = await findAthlete({
      lastName: entry.lastName,
      firstName: entry.firstName,
      middleName: entry.middleName
    });

    if (!athlete) {
      notFound++;
      continue;
    }

    console.log(`\n👤 ${entry.lastName} ${entry.firstName || ''} (ID: ${athlete.id})`);

    // Обновляем group_name и schedule
    await updateAthleteMetadata(athlete.id, entry.group, entry.schedule);

    // Создаём performances
    await upsertPerformance(athlete.id, 'Подтягивания', entry.pullups, month, year);
    await upsertPerformance(athlete.id, 'Отжимания от брусьев', entry.dips, month, year);
    await upsertPerformance(athlete.id, 'Отжимания от пола', entry.pushups, month, year);

    imported++;
  }

  console.log(`\n✅ ${month} ${year} import complete:`);
  console.log(`   - Imported: ${imported}`);
  console.log(`   - Not found: ${notFound}`);
  console.log(`   - Skipped: ${skipped}`);
}

// ============================================
// RUN IMPORT
// ============================================

(async () => {
  try {
    console.log('🚀 Starting September & October 2025 import...\n');

    await importMonthData(SEPTEMBER_2025, 9, 2025);
    await importMonthData(OCTOBER_2025, 10, 2025);

    console.log('\n🎉 Import completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
})();
