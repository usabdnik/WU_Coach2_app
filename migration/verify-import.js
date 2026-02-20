import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

console.log('✅ Supabase client initialized\n');

async function verifyImport() {
  try {
    // Проверяем несколько конкретных спортсменов из импорта
    const testAthletes = [
      'Рудин Никита',
      'Загребин',
      'Балобанов',
      'Михеев Михаил',
      'Попков Константин'
    ];

    console.log('🔍 Проверяем импортированные данные...\n');

    for (const name of testAthletes) {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, full_name, group_name, performance_records')
        .ilike('full_name', `%${name}%`)
        .limit(1)
        .single();

      if (error) {
        console.log(`❌ ${name}: Ошибка - ${error.message}`);
        continue;
      }

      if (!data) {
        console.log(`⚠️  ${name}: Не найден в БД`);
        continue;
      }

      // Проверяем наличие результатов сентября/октября
      const records = data.performance_records || {};
      const hasRecords = Object.keys(records).length > 0;
      const recentDates = Object.keys(records)
        .filter(date => date.startsWith('2024-09') || date.startsWith('2024-10') || date.startsWith('2025-09') || date.startsWith('2025-10'))
        .slice(0, 3);

      console.log(`✅ ${data.full_name} (${data.group_name || 'без группы'})`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Записей: ${Object.keys(records).length}`);
      if (recentDates.length > 0) {
        console.log(`   Последние даты: ${recentDates.join(', ')}`);
      }
      console.log('');
    }

    // Статистика по всем спортсменам
    const { data: allAthletes, error: statsError } = await supabase
      .from('athletes')
      .select('id, full_name, performance_records');

    if (statsError) {
      console.error('❌ Ошибка получения статистики:', statsError);
      return;
    }

    let athletesWithSeptOctData = 0;
    let totalRecords = 0;

    allAthletes.forEach(athlete => {
      const records = athlete.performance_records || {};
      const hasSeptOct = Object.keys(records).some(date => 
        date.startsWith('2024-09') || date.startsWith('2024-10') ||
        date.startsWith('2025-09') || date.startsWith('2025-10')
      );
      if (hasSeptOct) athletesWithSeptOctData++;
      totalRecords += Object.keys(records).length;
    });

    console.log('📊 Общая статистика:');
    console.log(`   Всего спортсменов в БД: ${allAthletes.length}`);
    console.log(`   С данными сент/окт: ${athletesWithSeptOctData}`);
    console.log(`   Всего записей результатов: ${totalRecords}`);
    console.log('');
    console.log('✅ Проверка завершена!');

  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
    process.exit(1);
  }
}

verifyImport();
