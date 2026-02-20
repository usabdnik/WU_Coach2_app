#!/usr/bin/env node

/**
 * Дополнение недостающих данных за сентябрь и октябрь 2025
 *
 * ЛОГИКА:
 * - Проверяет наличие данных у каждого спортсмена за сентябрь/октябрь 2025
 * - Добавляет данные ТОЛЬКО если их нет
 * - Пропускает спортсменов с существующими данными
 * - НЕ удаляет и НЕ перезаписывает ничего
 * - Сохраняет все данные за ноябрь
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// ДАННЫЕ ЗА СЕНТЯБРЬ 2025 (из текста пользователя)
// ============================================

const SEPTEMBER_2025 = [
  // А-218
  { lastName: 'Владыкин', firstName: 'Лев', group: 'А-218', pullUps: 5, dips: 6, pushUps: null },
  { lastName: 'Рудин', firstName: 'Никита', group: 'А-218', pullUps: 15, dips: 10, pushUps: null },
  { lastName: 'Трудолюбов', firstName: 'Лев', group: 'А-218', pullUps: 0, dips: 3, pushUps: null },
  { lastName: 'Дубков', firstName: 'Богдан', group: 'А-218', pullUps: 4, dips: 10, pushUps: null },
  { lastName: 'Внукова', firstName: 'Софья', group: 'А-218', pullUps: 0, dips: 0, pushUps: 11 },
  { lastName: 'Мотошков', firstName: 'Антон', group: 'А-218', pullUps: 12, dips: 3, pushUps: null },
  { lastName: 'Богородский', firstName: 'Макар', group: 'А-218', pullUps: 6, dips: null, pushUps: null },
  { lastName: 'Каршиев', firstName: 'Захар', group: 'А-218', pullUps: 24, dips: 19, pushUps: null },
  // Чесноков - вручную, пропускаем
  { lastName: 'Носкова', firstName: 'Алиса', group: 'А-218', pullUps: null, dips: null, pushUps: 15 },

  // А-219
  { lastName: 'Вежеев', firstName: 'Андрей', group: 'А-219', pullUps: 10, dips: 16, pushUps: null },
  { lastName: 'Киселев', firstName: 'Святослав', group: 'А-219', pullUps: 4, dips: 6, pushUps: null },

  // М-19
  { lastName: 'Мнацаканян', firstName: 'ПБ', group: 'М-19', pullUps: 6, dips: null, pushUps: null },
  { lastName: 'Байгозин', firstName: null, group: 'М-19', pullUps: 16, dips: 30, pushUps: null },
  { lastName: 'Бобылев', firstName: null, group: 'М-19', pullUps: 16, dips: 15, pushUps: null },
  { lastName: 'Дулесов', firstName: null, group: 'М-19', pullUps: 15, dips: 16, pushUps: null },
  { lastName: 'Хайдаров', firstName: null, group: 'М-19', pullUps: 10, dips: 14, pushUps: null },

  // М-117
  { lastName: 'Балобанов', firstName: null, group: 'М-117', pullUps: 23, dips: 42, pushUps: null },
  { lastName: 'Загребин', firstName: null, group: 'М-117', pullUps: 31, dips: 60, pushUps: null },
  { lastName: 'Кулаков', firstName: null, group: 'М-117', pullUps: 10, dips: 18, pushUps: null },
  { lastName: 'Ломаев', firstName: null, group: 'М-117', pullUps: 4, dips: 9, pushUps: null },
  { lastName: 'Какшинский', firstName: null, group: 'М-117', pullUps: 12, dips: 15, pushUps: null },
  { lastName: 'Тумбаков', firstName: null, group: 'М-117', pullUps: 11, dips: 1, pushUps: null },
  { lastName: 'Стерхов', firstName: null, group: 'М-117', pullUps: 18, dips: 20, pushUps: null },
  { lastName: 'Хорин', firstName: null, group: 'М-117', pullUps: 9, dips: 25, pushUps: null },
  { lastName: 'Щекотова', firstName: null, group: 'М-117', pullUps: 11, dips: 6, pushUps: null },
  { lastName: 'Тарасов', firstName: null, group: 'М-117', pullUps: 15, dips: 16, pushUps: null },
  { lastName: 'Осеев', firstName: null, group: 'М-117', pullUps: 15, dips: 20, pushUps: null },
  { lastName: 'Лебедев', firstName: null, group: 'М-117', pullUps: 1, dips: 0, pushUps: null },
  { lastName: 'Романов', firstName: null, group: 'М-117', pullUps: 13, dips: 21, pushUps: null },
  // Касаткин, Зайцев, Ризванов, Климентьев, Васильев, Логинов, Коновалов - пропускаем

  // М-118
  { lastName: 'Попков', firstName: 'Костя', group: 'М-118', pullUps: 4, dips: 3, pushUps: null },
  { lastName: 'Чумаков', firstName: 'Дмитрий', group: 'М-118', pullUps: 4, dips: 0, pushUps: null },
  { lastName: 'Зеленских', firstName: 'Степан', group: 'М-118', pullUps: 12, dips: 6, pushUps: null },
  { lastName: 'Зеленских', firstName: 'Александр', group: 'М-118', pullUps: 5, dips: 5, pushUps: null },
  { lastName: 'Шайгатяммов', firstName: 'Р', group: 'М-118', pullUps: 6, dips: 0, pushUps: null },
  { lastName: 'Скобелев', firstName: null, group: 'М-118', pullUps: 13, dips: 9, pushUps: null },
  { lastName: 'Трескин', firstName: null, group: 'М-118', pullUps: 15, dips: 15, pushUps: null },
  { lastName: 'Чесноков', firstName: null, group: 'М-118', pullUps: 10, dips: 24, pushUps: null },
  { lastName: 'Нурутдинов', firstName: 'Алмаз', group: 'М-118', pullUps: 32, dips: 35, pushUps: null },
  // Красноперов - пропускаем
];

// ============================================
// ДАННЫЕ ЗА ОКТЯБРЬ 2025 (из текста пользователя)
// ============================================

const OCTOBER_2025 = [
  // А-29
  { lastName: 'Михеев', firstName: 'Михаил', group: 'А-29', pullUps: 3, dips: 2, pushUps: null },
  { lastName: 'Утробин', firstName: 'Артём', group: 'А-29', pullUps: 20, dips: 15, pushUps: null },
  { lastName: 'Финский', firstName: 'Тимофей', group: 'А-29', pullUps: 0, dips: 5, pushUps: null },
  { lastName: 'Вахрушев', firstName: 'Михаил', group: 'А-29', pullUps: 0, dips: null, pushUps: 2 },

  // А-218
  { lastName: 'Владыкин', firstName: 'Лев', group: 'А-218', pullUps: 6, dips: 10, pushUps: null },
  { lastName: 'Рудин', firstName: 'Никита', group: 'А-218', pullUps: 9, dips: 9, pushUps: null },
  { lastName: 'Трудолюбов', firstName: 'Лев', group: 'А-218', pullUps: 1, dips: null, pushUps: 20 },
  { lastName: 'Дубков', firstName: 'Богдан', group: 'А-218', pullUps: 6, dips: 6, pushUps: null },
  { lastName: 'Внукова', firstName: 'Софья', group: 'А-218', pullUps: 0, dips: null, pushUps: 20 },
  // Мотошков, Богородский - пропускаем (пустые)
  { lastName: 'Каршиев', firstName: 'Захар', group: 'А-218', pullUps: 22, dips: 21, pushUps: null },
  { lastName: 'Чесноков', firstName: 'Александр', group: 'А-218', pullUps: 10, dips: 28, pushUps: null },
  // Носкова - пропускаем
  { lastName: 'Вахрушев', firstName: 'Савелий', group: 'А-218', pullUps: 1, dips: null, pushUps: 22 },

  // А-219
  // Вежеев, Киселев - пропускаем
  { lastName: 'Новосёлов', firstName: 'Дмитрий', group: 'А-219', pullUps: 4, dips: 10, pushUps: null },
  { lastName: 'Желудов', firstName: 'Михаил', group: 'А-219', pullUps: 11, dips: 15, pushUps: null },
  { lastName: 'Колеватов', firstName: 'Иван', group: 'А-219', pullUps: 12, dips: 13, pushUps: null },

  // М-19
  // Мнацаканян - пропускаем
  { lastName: 'Байгозин', firstName: null, group: 'М-19', pullUps: 15, dips: 26, pushUps: null },
  { lastName: 'Бобылев', firstName: null, group: 'М-19', pullUps: 15, dips: 23, pushUps: null },
  // Дулесов, Хайдаров - пропускаем

  // М-117
  { lastName: 'Балобанов', firstName: null, group: 'М-117', pullUps: 23, dips: 46, pushUps: null },
  { lastName: 'Загребин', firstName: null, group: 'М-117', pullUps: 30, dips: 53, pushUps: null },
  { lastName: 'Кулаков', firstName: null, group: 'М-117', pullUps: 10, dips: 20, pushUps: null },
  { lastName: 'Ломаев', firstName: null, group: 'М-117', pullUps: 4, dips: 12, pushUps: null },
  { lastName: 'Какшинский', firstName: null, group: 'М-117', pullUps: 10, dips: 5, pushUps: null },
  { lastName: 'Тумбаков', firstName: null, group: 'М-117', pullUps: 10, dips: 3, pushUps: null },
  { lastName: 'Стерхов', firstName: null, group: 'М-117', pullUps: 20, dips: 30, pushUps: null },
  { lastName: 'Хорин', firstName: null, group: 'М-117', pullUps: 12, dips: 32, pushUps: null },
  { lastName: 'Щекотова', firstName: null, group: 'М-117', pullUps: 10, dips: 10, pushUps: null },
  { lastName: 'Тарасов', firstName: null, group: 'М-117', pullUps: 20, dips: 22, pushUps: null },
  { lastName: 'Осеев', firstName: null, group: 'М-117', pullUps: 12, dips: 30, pushUps: null },
  { lastName: 'Лебедев', firstName: null, group: 'М-117', pullUps: 0, dips: 0, pushUps: null },
  { lastName: 'Романов', firstName: null, group: 'М-117', pullUps: 12, dips: 30, pushUps: null },
  { lastName: 'Касаткин', firstName: 'Ярослав', group: 'М-117', pullUps: 30, dips: 43, pushUps: null },
  { lastName: 'Зайцев', firstName: 'Михаил', group: 'М-117', pullUps: 6, dips: 10, pushUps: null },
  // Ризванов - пропускаем
  { lastName: 'Климентьев', firstName: null, group: 'М-117', pullUps: 10, dips: 13, pushUps: null },
  // Васильев - пропускаем
  { lastName: 'Логинов', firstName: null, group: 'М-117', pullUps: 24, dips: 50, pushUps: null },
  // Коновалов - пропускаем
  { lastName: 'Поклонов', firstName: 'Егор', group: 'М-117', pullUps: 13, dips: 18, pushUps: null },

  // М-118
  { lastName: 'Попков', firstName: 'Костя', group: 'М-118', pullUps: 13, dips: 3, pushUps: null },
  { lastName: 'Чумаков', firstName: 'Дмитрий', group: 'М-118', pullUps: 5, dips: 7, pushUps: null },
  { lastName: 'Зеленских', firstName: 'Степан', group: 'М-118', pullUps: 13, dips: 12, pushUps: null },
  { lastName: 'Зеленских', firstName: 'Александр', group: 'М-118', pullUps: 5, dips: 10, pushUps: null },
  { lastName: 'Шайгатяммов', firstName: 'Р', group: 'М-118', pullUps: 7, dips: 1, pushUps: null },
  { lastName: 'Скобелев', firstName: null, group: 'М-118', pullUps: 16, dips: 20, pushUps: null },
  { lastName: 'Трескин', firstName: null, group: 'М-118', pullUps: 17, dips: 20, pushUps: null },
  { lastName: 'Нурутдинов', firstName: 'Алмаз', group: 'М-118', pullUps: 28, dips: 32, pushUps: null },
  { lastName: 'Красноперов', firstName: 'Михаил', group: 'М-118', pullUps: 7, dips: 11, pushUps: null },
  { lastName: 'Самойлов', firstName: 'Роман', group: 'М-118', pullUps: 0, dips: 0, pushUps: null },
];

// ============================================
// ОСНОВНАЯ ЛОГИКА
// ============================================

/**
 * Нечёткий поиск спортсмена по фамилии
 */
async function findAthleteByLastName(lastName, firstName = null) {
  // Варианты с опечатками
  const variants = [
    lastName,
    lastName.replace(/е/gi, 'ё'),
    lastName.replace(/ё/gi, 'е'),
    lastName.replace(/а/gi, 'о'),
    lastName.replace(/о/gi, 'а'),
    lastName.replace(/и/gi, 'е'),
    lastName.replace(/е/gi, 'и'),
  ];

  for (const variant of variants) {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .ilike('name', `${variant}%`);

    if (error) {
      console.error(`❌ Ошибка поиска ${lastName}:`, error.message);
      continue;
    }

    if (data && data.length > 0) {
      if (firstName) {
        const match = data.find(a => a.name.toLowerCase().includes(firstName.toLowerCase()));
        if (match) return match;
      }
      return data[0];
    }
  }

  return null;
}

/**
 * Проверка наличия данных за указанный месяц
 */
async function hasPerformanceForMonth(athleteId, year, month) {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  // Используем последний день месяца (30 дней для сентября)
  const lastDay = month === 9 ? 30 : (month === 10 ? 31 : 30);
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

  const { data, error } = await supabase
    .from('performances')
    .select('id')
    .eq('athlete_id', athleteId)
    .gte('recorded_at', startDate)
    .lte('recorded_at', endDate)
    .limit(1);

  if (error) {
    console.error(`❌ Ошибка проверки данных:`, error.message);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Создать нового спортсмена
 */
async function createAthlete(lastName, firstName, group) {
  const name = firstName ? `${lastName} ${firstName}` : lastName;

  const { data, error } = await supabase
    .from('athletes')
    .insert({
      name: name,
      group_name: group,
      status: 'active',
      season: '2024-2025'
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Ошибка создания ${name}:`, error.message);
    return null;
  }

  console.log(`✅ Создан новый спортсмен: ${name} (ID: ${data.id})`);
  return data;
}

/**
 * Добавить показатель
 */
async function addPerformance(athleteId, exerciseId, value, recordedAt) {
  if (value === null || value === undefined) return;

  const { error } = await supabase
    .from('performances')
    .insert({
      athlete_id: athleteId,
      exercise_id: exerciseId,
      value: value,
      recorded_at: recordedAt
    });

  if (error) {
    console.error(`❌ Ошибка добавления показателя:`, error.message);
  }
}

/**
 * Основная функция импорта
 */
async function importMissingData() {
  console.log('🚀 Дополнение недостающих данных за сентябрь и октябрь 2025\n');

  // Получаем ID упражнений
  const { data: exercises, error: exError } = await supabase
    .from('exercises')
    .select('*')
    .in('name', ['Подтягивания', 'Отжимания от брусьев', 'Отжимания от пола']);

  if (exError) {
    console.error('❌ Ошибка получения упражнений:', exError.message);
    return;
  }

  const pullUpsExercise = exercises.find(e => e.name === 'Подтягивания');
  const dipsExercise = exercises.find(e => e.name === 'Отжимания от брусьев');
  const pushUpsExercise = exercises.find(e => e.name === 'Отжимания от пола');

  if (!pullUpsExercise || !dipsExercise || !pushUpsExercise) {
    console.error('❌ Не найдены базовые упражнения');
    return;
  }

  console.log('✅ Упражнения найдены\n');

  // ========================================
  // ИМПОРТ СЕНТЯБРЬ 2025
  // ========================================
  console.log('📅 СЕНТЯБРЬ 2025\n');
  let addedSept = 0;
  let skippedSept = 0;
  let newAthletesSept = 0;

  for (const record of SEPTEMBER_2025) {
    const { lastName, firstName, group, pullUps, dips, pushUps } = record;

    // Ищем спортсмена
    let athlete = await findAthleteByLastName(lastName, firstName);

    // Если не найден, создаём
    if (!athlete) {
      athlete = await createAthlete(lastName, firstName, group);
      if (athlete) {
        newAthletesSept++;
      } else {
        console.log(`   ❌ ${lastName} ${firstName || ''} - не удалось создать`);
        continue;
      }
    }

    // Проверяем, есть ли у него данные за сентябрь
    const hasSeptData = await hasPerformanceForMonth(athlete.id, 2025, 9);

    if (hasSeptData) {
      console.log(`   ⏭️  ${athlete.name} - уже есть данные за сентябрь, пропускаем`);
      skippedSept++;
      continue;
    }

    // Добавляем данные
    console.log(`   ➕ ${athlete.name} (${group}):`);
    const septDate = '2025-09-15';

    if (pullUps !== null && pullUps !== undefined) {
      await addPerformance(athlete.id, pullUpsExercise.id, pullUps, septDate);
      console.log(`      ✅ Подтягивания: ${pullUps}`);
    }

    if (dips !== null && dips !== undefined) {
      await addPerformance(athlete.id, dipsExercise.id, dips, septDate);
      console.log(`      ✅ Брусья: ${dips}`);
    }

    if (pushUps !== null && pushUps !== undefined) {
      await addPerformance(athlete.id, pushUpsExercise.id, pushUps, septDate);
      console.log(`      ✅ Отжимания: ${pushUps}`);
    }

    addedSept++;
  }

  console.log(`\n📊 Сентябрь: добавлено ${addedSept}, пропущено ${skippedSept}, создано новых ${newAthletesSept}\n`);

  // ========================================
  // ИМПОРТ ОКТЯБРЬ 2025
  // ========================================
  console.log('📅 ОКТЯБРЬ 2025\n');
  let addedOct = 0;
  let skippedOct = 0;
  let newAthletesOct = 0;

  for (const record of OCTOBER_2025) {
    const { lastName, firstName, group, pullUps, dips, pushUps } = record;

    // Ищем спортсмена
    let athlete = await findAthleteByLastName(lastName, firstName);

    // Если не найден, создаём
    if (!athlete) {
      athlete = await createAthlete(lastName, firstName, group);
      if (athlete) {
        newAthletesOct++;
      } else {
        console.log(`   ❌ ${lastName} ${firstName || ''} - не удалось создать`);
        continue;
      }
    }

    // Проверяем, есть ли у него данные за октябрь
    const hasOctData = await hasPerformanceForMonth(athlete.id, 2025, 10);

    if (hasOctData) {
      console.log(`   ⏭️  ${athlete.name} - уже есть данные за октябрь, пропускаем`);
      skippedOct++;
      continue;
    }

    // Добавляем данные
    console.log(`   ➕ ${athlete.name} (${group}):`);
    const octDate = '2025-10-15';

    if (pullUps !== null && pullUps !== undefined) {
      await addPerformance(athlete.id, pullUpsExercise.id, pullUps, octDate);
      console.log(`      ✅ Подтягивания: ${pullUps}`);
    }

    if (dips !== null && dips !== undefined) {
      await addPerformance(athlete.id, dipsExercise.id, dips, octDate);
      console.log(`      ✅ Брусья: ${dips}`);
    }

    if (pushUps !== null && pushUps !== undefined) {
      await addPerformance(athlete.id, pushUpsExercise.id, pushUps, octDate);
      console.log(`      ✅ Отжимания: ${pushUps}`);
    }

    addedOct++;
  }

  console.log(`\n📊 Октябрь: добавлено ${addedOct}, пропущено ${skippedOct}, создано новых ${newAthletesOct}\n`);
  console.log('🎉 ГОТОВО!\n');
}

// Запускаем импорт
importMissingData().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
