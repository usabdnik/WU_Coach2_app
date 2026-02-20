import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ИНСТРУКЦИЯ:
// 1. Откройте приложение на КОМПЬЮТЕРЕ (где правильные группы)
// 2. Откройте DevTools (F12)
// 3. Во вкладке Console выполните:
//    copy(JSON.stringify(JSON.parse(localStorage.athletesData)))
// 4. Вставьте результат в файл athletes-backup.json в этой директории
// 5. Запустите: node restore-from-localStorage.js

async function restoreGroups() {
  console.log('🔄 Восстановление групп из localStorage...\n');

  // Читаем данные из файла
  if (!fs.existsSync('./athletes-backup.json')) {
    console.error('❌ Файл athletes-backup.json не найден!');
    console.log('\n📋 ИНСТРУКЦИЯ:');
    console.log('1. Откройте приложение на компьютере (где правильные группы)');
    console.log('2. Откройте DevTools (F12) → Console');
    console.log('3. Выполните команду:');
    console.log('   copy(JSON.stringify(JSON.parse(localStorage.athletesData)))');
    console.log('4. Создайте файл athletes-backup.json и вставьте туда данные');
    console.log('5. Запустите этот скрипт снова\n');
    return;
  }

  const athletesFromLocalStorage = JSON.parse(fs.readFileSync('./athletes-backup.json', 'utf-8'));
  console.log(`📊 Найдено ${athletesFromLocalStorage.length} спортсменов в backup\n`);

  let restored = 0;
  let skipped = 0;

  for (const athlete of athletesFromLocalStorage) {
    if (!athlete.group || athlete.group === 'null') {
      skipped++;
      continue;
    }

    console.log(`✅ ${athlete.name}: "${athlete.group}"`);

    const { error } = await supabase
      .from('athletes')
      .update({ group_name: athlete.group })
      .eq('id', athlete.id);

    if (error) {
      console.error(`❌ Ошибка: ${error.message}`);
    } else {
      restored++;
    }
  }

  console.log('\n✅ Восстановление завершено!');
  console.log(`   Восстановлено: ${restored} человек`);
  console.log(`   Пропущено (без группы): ${skipped} человек`);
}

restoreGroups();