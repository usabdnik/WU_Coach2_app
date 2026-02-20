import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ПРИМЕР: Назначение групп по списку
// Замените на реальные данные
const GROUP_ASSIGNMENTS = {
  'М-19': [
    'Балобанов Михаил Александрович',
    'Хайдаров Айдар Зифнирович',
    // ... добавьте остальных
  ],
  'М-117': [
    // Список спортсменов для М-117
  ],
  'М-118': [
    // Список спортсменов для М-118
  ],
  'А-29': [
    // Список спортсменов для А-29
  ],
  'А-218': [
    'Александр Чесноков', // Уже назначено
  ],
  'А-219': [
    // Список спортсменов для А-219
  ]
};

async function assignGroupsBulk() {
  console.log('🔄 Массовое назначение групп...\n');

  // Получаем всех спортсменов
  const { data: athletes, error: fetchError } = await supabase
    .from('athletes')
    .select('id, name');

  if (fetchError) {
    console.error('❌ Ошибка загрузки:', fetchError.message);
    return;
  }

  console.log(`📊 Всего спортсменов: ${athletes.length}\n`);

  let updated = 0;
  let skipped = 0;

  // Назначаем группы
  for (const [groupName, athleteNames] of Object.entries(GROUP_ASSIGNMENTS)) {
    console.log(`\n📋 Группа: ${groupName} (${athleteNames.length} человек)`);

    for (const athleteName of athleteNames) {
      const athlete = athletes.find(a => a.name === athleteName);

      if (!athlete) {
        console.warn(`⚠️  Спортсмен не найден: ${athleteName}`);
        skipped++;
        continue;
      }

      console.log(`   ✅ ${athleteName} → ${groupName}`);

      const { error: updateError } = await supabase
        .from('athletes')
        .update({ group_name: groupName })
        .eq('id', athlete.id);

      if (updateError) {
        console.error(`   ❌ Ошибка: ${updateError.message}`);
      } else {
        updated++;
      }
    }
  }

  console.log('\n✅ Массовое назначение завершено!');
  console.log(`   Обновлено: ${updated} человек`);
  console.log(`   Пропущено: ${skipped} человек`);
}

assignGroupsBulk();