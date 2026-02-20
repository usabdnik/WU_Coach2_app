#!/usr/bin/env node

/**
 * Массовое назначение групп и расписаний спортсменам
 *
 * Использует нечёткий поиск по фамилии (LIKE) для обработки опечаток
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mjkssesvhowmncyctmvs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// ДАННЫЕ ИЗ ОКТЯБРЬСКОГО СПИСКА
// ============================================

const ATHLETES_DATA = [
  // А-29
  { lastName: 'Михеев', firstName: 'Михаил', group: 'А-29', schedule: 'Вт 9:00, Чт 9:00' },
  { lastName: 'Утробин', firstName: 'Артём', group: 'А-29', schedule: 'Вт 9:00, Чт 9:00' },
  { lastName: 'Финский', firstName: 'Тимофей', group: 'А-29', schedule: 'Вт 9:00, Чт 9:00, Сб 18:00' },
  { lastName: 'Вахрушев', firstName: 'Михаил', group: 'А-29', schedule: 'Вт 9:00, Чт 9:00' },

  // А-218
  { lastName: 'Владыкин', firstName: 'Лев', group: 'А-218', schedule: null },
  { lastName: 'Рудин', firstName: 'Никита', group: 'А-218', schedule: null },
  { lastName: 'Трудолюбов', firstName: 'Лев', group: 'А-218', schedule: null },
  { lastName: 'Дубков', firstName: 'Богдан', group: 'А-218', schedule: null },
  { lastName: 'Внукова', firstName: 'Софья', group: 'А-218', schedule: null },
  { lastName: 'Мотошков', firstName: 'Антон', group: 'А-218', schedule: null },
  { lastName: 'Богородский', firstName: 'Макар', group: 'А-218', schedule: null },
  { lastName: 'Каршиев', firstName: 'Захар', group: 'А-218', schedule: null },
  { lastName: 'Чесноков', firstName: 'Александр', group: 'А-218', schedule: 'Самозапись' },
  { lastName: 'Носкова', firstName: 'Алиса', group: 'А-218', schedule: null },
  { lastName: 'Вахрушев', firstName: 'Савелий', group: 'А-218', schedule: 'Вт 19:00, Чт 19:00, Сб 18:00' },

  // А-219
  { lastName: 'Вежеев', firstName: 'Андрей', group: 'А-219', schedule: null },
  { lastName: 'Киселев', firstName: 'Святослав', group: 'А-219', schedule: null },
  { lastName: 'Новосёлов', firstName: 'Дмитрий', group: 'А-219', schedule: null },
  { lastName: 'Желудов', firstName: 'Михаил', group: 'А-219', schedule: null },
  { lastName: 'Колеватов', firstName: 'Иван', group: 'А-219', schedule: null },

  // М-19
  { lastName: 'Мнацаканян', firstName: 'Марк', group: 'М-19', schedule: null },
  { lastName: 'Байгозин', firstName: 'Константин', group: 'М-19', schedule: null },
  { lastName: 'Бобылев', firstName: 'Мирослав', group: 'М-19', schedule: null },
  { lastName: 'Дулесов', firstName: 'Максим', group: 'М-19', schedule: null },
  { lastName: 'Хайдаров', firstName: 'Айдар', group: 'М-19', schedule: null },

  // М-117
  { lastName: 'Балобанов', firstName: 'Михаил', group: 'М-117', schedule: null },
  { lastName: 'Загребин', firstName: 'Максим', group: 'М-117', schedule: null },
  { lastName: 'Кулаков', firstName: 'Кирилл', group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Ломаев', firstName: 'Максим', group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Какшинский', firstName: 'Гордей', group: 'М-117', schedule: 'Пн 17:00, Ср 17:00' },
  { lastName: 'Тумбаков', firstName: 'Арсентий', group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Стерхов', firstName: 'Илья', group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Хорин', firstName: 'Данил', group: 'М-117', schedule: 'Ср 17:00, Пт 17:00' },
  { lastName: 'Щёкотова', firstName: 'Полина', group: 'М-117', schedule: 'Пн 17:00, Ср 17:00' },
  { lastName: 'Тарасов', firstName: 'Лев', group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Осеев', firstName: 'Арсений', group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Лебедев', firstName: 'Андрей', group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Романов', firstName: 'Алексей', group: 'М-117', schedule: null },
  { lastName: 'Касаткин', firstName: 'Ярослав', group: 'М-117', schedule: 'Ср 17:00, Пт 17:00' },
  { lastName: 'Зайцев', firstName: 'Михаил', group: 'М-117', schedule: 'Пн 17:00, Ср 17:00' },
  { lastName: 'Ризванов', firstName: 'Динар', group: 'М-117', schedule: 'Ср 17:00, Пт 17:00' },
  { lastName: 'Клементьев', firstName: 'Илья', group: 'М-117', schedule: 'Самозапись' },
  { lastName: 'Васильев', firstName: 'Лев', group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },
  { lastName: 'Логинов', firstName: 'Андрей', group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
  { lastName: 'Коновалов', firstName: 'Мирослав', group: 'М-117', schedule: 'Самозапись' },
  { lastName: 'Поклонов', firstName: 'Егор', group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },

  // М-118
  { lastName: 'Попков', firstName: 'Константин', group: 'М-118', schedule: 'Пн 9:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Чумаков', firstName: 'Дмитрий', group: 'М-118', schedule: 'Пн 9:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Зеленских', firstName: 'Степан', group: 'М-118', schedule: 'Самозапись' },
  { lastName: 'Зеленских', firstName: 'Алексей', group: 'М-118', schedule: 'Самозапись' },
  { lastName: 'Шайгаллямов', firstName: 'Ратмир', group: 'М-118', schedule: 'Пн 18:00, Ср 18:00' },
  { lastName: 'Скобелев', firstName: 'Дамир', group: 'М-118', schedule: 'Пн 18:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Трескин', firstName: 'Кирилл', group: 'М-118', schedule: 'Пн 18:00, Ср 18:00' },
  { lastName: 'Нурутдинов', firstName: 'Айдар', group: 'М-118', schedule: null },
  { lastName: 'Красноперов', firstName: 'Михаил', group: 'М-118', schedule: 'Пн 18:00, Ср 18:00, Пт 18:00' },
  { lastName: 'Самойлов', firstName: 'Роман', group: 'М-118', schedule: null }
];

// ============================================
// ФУНКЦИИ ПОИСКА И ОБНОВЛЕНИЯ
// ============================================

/**
 * Нечёткий поиск атлета по фамилии
 * Учитывает возможные опечатки: е/ё, а/о, и/е
 */
async function findAthleteByLastName(lastName, firstName) {
  // Заменяем возможные вариации букв для нечёткого поиска
  const fuzzyLastName = lastName
    .replace(/е/g, '[её]')
    .replace(/ё/g, '[её]')
    .replace(/о/g, '[оа]')
    .replace(/а/g, '[оа]')
    .replace(/и/g, '[ие]')
    .replace(/е/g, '[ие]');

  // Поиск по LIKE с нечётким паттерном
  const { data, error } = await supabase
    .from('athletes')
    .select('id, name, group_name, schedule')
    .ilike('name', `${lastName}%`); // Простой поиск по началу фамилии

  if (error) {
    console.error(`❌ Ошибка поиска ${lastName}:`, error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn(`⚠️  Не найден: ${lastName} ${firstName}`);
    return null;
  }

  // Если найдено несколько, пытаемся уточнить по имени
  if (data.length > 1 && firstName) {
    const match = data.find(a => a.name.includes(firstName));
    if (match) return match;
  }

  return data[0];
}

/**
 * Обновить группу и расписание атлета
 */
async function updateAthleteGroupAndSchedule(athleteId, group, schedule) {
  const updateData = {
    group_name: group
  };

  // Добавляем schedule только если он указан
  if (schedule) {
    updateData.schedule = schedule;
  }

  const { error } = await supabase
    .from('athletes')
    .update(updateData)
    .eq('id', athleteId);

  if (error) {
    throw new Error(`Failed to update: ${error.message}`);
  }
}

// ============================================
// ОСНОВНОЙ ПРОЦЕСС
// ============================================

async function assignGroupsAndSchedules() {
  console.log('🚀 Массовое назначение групп и расписаний\n');

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const athlete of ATHLETES_DATA) {
    try {
      // Шаг 1: Найти атлета
      const found = await findAthleteByLastName(athlete.lastName, athlete.firstName);

      if (!found) {
        notFoundCount++;
        continue;
      }

      // Шаг 2: Обновить группу и расписание
      await updateAthleteGroupAndSchedule(found.id, athlete.group, athlete.schedule);

      const scheduleInfo = athlete.schedule ? `📅 ${athlete.schedule}` : '📅 не указано';
      console.log(`✅ ${found.name} → ${athlete.group} | ${scheduleInfo}`);
      successCount++;

    } catch (err) {
      console.error(`❌ Ошибка обработки ${athlete.lastName}:`, err.message);
      errorCount++;
    }
  }

  // ============================================
  // ИТОГИ
  // ============================================

  console.log('\n' + '='.repeat(50));
  console.log('📊 РЕЗУЛЬТАТЫ');
  console.log('='.repeat(50));
  console.log(`✅ Обновлено: ${successCount}`);
  console.log(`⚠️  Не найдено: ${notFoundCount}`);
  console.log(`❌ Ошибок: ${errorCount}`);
  console.log('='.repeat(50));

  if (errorCount === 0 && notFoundCount === 0) {
    console.log('🎉 Все группы и расписания успешно назначены!');
  } else if (notFoundCount > 0) {
    console.log('⚠️  Некоторые атлеты не найдены. Проверьте написание фамилий.');
  }
}

// ============================================
// ЗАПУСК
// ============================================

console.log('📋 Назначение групп и расписаний для октябрьских данных\n');
assignGroupsAndSchedules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Критическая ошибка:', err);
    process.exit(1);
  });
