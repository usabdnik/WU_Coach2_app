#!/usr/bin/env node

/**
 * CRM Import Script - Синхронизация клиентов из Google Sheets в Supabase
 *
 * Назначение:
 * - Импортирует ФИО клиентов из CRM (Google Sheets)
 * - Обновляет статус активности (активен/неактивен) по наличию абонемента
 * - Использует Postgres функцию save_athlete_with_validation() для консистентности
 *
 * Запуск:
 * node migration/import-from-crm.js
 *
 * Переменные окружения:
 * SUPABASE_URL - URL вашего Supabase проекта
 * SUPABASE_SERVICE_KEY - Service role key (НЕ anon key!)
 * GOOGLE_SHEETS_ID - ID таблицы Google Sheets с данными CRM
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mjkssesvhowmncyctmvs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

// Google Service Account credentials (для доступа к Google Sheets)
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Маппинг групп (если в CRM другие названия)
const GROUP_MAPPING = {
  'beginners': 'Начинающие',
  'intermediate': 'Средняя',
  'advanced': 'Продвинутая',
  'elite': 'Элитная'
};

// ============================================
// VALIDATION
// ============================================

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not found in environment variables');
  process.exit(1);
}

if (!GOOGLE_SHEETS_ID) {
  console.error('❌ GOOGLE_SHEETS_ID not found in environment variables');
  process.exit(1);
}

if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.error('❌ Google Service Account credentials not found');
  process.exit(1);
}

// ============================================
// CLIENTS INITIALIZATION
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log('✅ Supabase client инициализирован');

const serviceAccountAuth = new JWT({
  email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_ID, serviceAccountAuth);
console.log('✅ Google Sheets client инициализирован');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Парсит ФИО из строки "Фамилия Имя" или "Фамилия Имя Отчество"
 */
function parseFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName: parts[2] || ''
  };
}

/**
 * Определяет статус активности по дате окончания абонемента
 */
function isActive(subscriptionEndDate) {
  if (!subscriptionEndDate) return false;

  const endDate = new Date(subscriptionEndDate);
  const today = new Date();

  return endDate >= today;
}

/**
 * Нормализует название группы
 */
function normalizeGroup(group) {
  if (!group) return 'Начинающие'; // Default group

  const normalized = group.toLowerCase().trim();
  return GROUP_MAPPING[normalized] || group;
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

async function syncAthletesFromCRM() {
  try {
    console.log('📥 Загрузка данных из Google Sheets...');

    await doc.loadInfo();
    console.log(`📊 Таблица: ${doc.title}`);

    // Предполагаем, что данные клиентов на первом листе
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadHeaderRow();

    const rows = await sheet.getRows();
    console.log(`📋 Найдено ${rows.length} записей в CRM`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const row of rows) {
      try {
        // Извлекаем данные из Google Sheets
        // ВАЖНО: Замените названия колонок на реальные из вашей CRM таблицы
        const fullName = row.get('ФИО') || row.get('Имя') || '';
        const group = row.get('Группа') || row.get('Group') || '';
        const subscriptionEnd = row.get('Дата окончания абонемента') || row.get('Subscription End') || '';
        const phone = row.get('Телефон') || row.get('Phone') || '';
        const email = row.get('Email') || '';

        if (!fullName) {
          console.warn('⚠️ Пропущена строка без ФИО');
          continue;
        }

        const { lastName, firstName, middleName } = parseFullName(fullName);
        const status = isActive(subscriptionEnd) ? 'active' : 'inactive';
        const normalizedGroup = normalizeGroup(group);

        // Формируем данные для Supabase
        const athleteData = {
          name: fullName,
          group: normalizedGroup,
          status: status,
          // Дополнительные поля (если нужно):
          // phone: phone,
          // email: email,
          // subscription_end: subscriptionEnd
        };

        // Вызываем Postgres функцию для сохранения
        const { data, error } = await supabase.rpc('save_athlete_with_validation', {
          p_athlete_data: athleteData
        });

        if (error) {
          throw error;
        }

        console.log(`✅ ${fullName} → ${status} (${normalizedGroup})`);
        successCount++;

      } catch (rowError) {
        console.error(`❌ Ошибка обработки строки:`, rowError.message);
        errorCount++;
        errors.push({
          row: row.rowNumber,
          name: row.get('ФИО'),
          error: rowError.message
        });
      }
    }

    // ============================================
    // SUMMARY
    // ============================================

    console.log('\n' + '='.repeat(50));
    console.log('📊 РЕЗУЛЬТАТЫ СИНХРОНИЗАЦИИ');
    console.log('='.repeat(50));
    console.log(`✅ Успешно: ${successCount}`);
    console.log(`❌ Ошибки: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Детали ошибок:');
      errors.forEach(err => {
        console.log(`  Строка ${err.row} (${err.name}): ${err.error}`);
      });
    }

    console.log('='.repeat(50));

    if (errorCount === 0) {
      console.log('🎉 Синхронизация завершена успешно!');
      process.exit(0);
    } else {
      console.log('⚠️ Синхронизация завершена с ошибками');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Критическая ошибка синхронизации:', error);
    process.exit(1);
  }
}

// ============================================
// RUN
// ============================================

console.log('🚀 Запуск синхронизации из CRM...\n');
syncAthletesFromCRM();
