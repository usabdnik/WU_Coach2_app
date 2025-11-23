import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Новые группы (оставляем как есть)
const NEW_GROUPS = ['М-19', 'М-117', 'М-118', 'А-29', 'А-218', 'А-219'];

// Старые группы из Moyklass (обнуляем)
const OLD_GROUPS_TO_CLEAR = ['Начинающие', 'Средняя', 'Продвинутая', 'Элитная', 'Базовая', 'Основная'];

async function migrateGroups() {
  console.log('🔄 Миграция групп на новую систему...\n');

  // Получаем всех спортсменов
  const { data: athletes, error: fetchError } = await supabase
    .from('athletes')
    .select('id, name, group_name');

  if (fetchError) {
    console.error('❌ Ошибка загрузки:', fetchError.message);
    return;
  }

  console.log(`📊 Всего спортсменов: ${athletes.length}\n`);

  // Группируем для статистики
  const stats = {
    cleared: 0,      // Старые группы → null
    kept: 0,         // Новые группы → оставлены
    unchanged: 0     // Уже null → без изменений
  };
  const clearedGroups = {};

  for (const athlete of athletes) {
    const currentGroup = athlete.group_name;

    // Если старая группа → обнуляем
    if (OLD_GROUPS_TO_CLEAR.includes(currentGroup)) {
      clearedGroups[currentGroup] = (clearedGroups[currentGroup] || 0) + 1;
      stats.cleared++;

      console.log(`🔄 ${athlete.name}: "${currentGroup}" → null (обнулена старая группа)`);

      const { error: updateError } = await supabase
        .from('athletes')
        .update({ group_name: null })
        .eq('id', athlete.id);

      if (updateError) {
        console.error(`❌ Ошибка обновления ${athlete.name}:`, updateError.message);
      }
    }
    // Если новая группа → оставляем как есть
    else if (NEW_GROUPS.includes(currentGroup)) {
      stats.kept++;
      console.log(`✅ ${athlete.name}: "${currentGroup}" (сохранена вручную назначенная группа)`);
    }
    // Если уже null/пусто → ничего не делаем
    else if (!currentGroup) {
      stats.unchanged++;
    }
    // Неизвестная группа → предупреждение
    else {
      console.warn(`⚠️  ${athlete.name}: неизвестная группа "${currentGroup}" (оставлена без изменений)`);
    }
  }

  console.log('\n✅ Миграция завершена!\n');
  console.log('📈 Статистика миграции:');
  console.log(`  🔄 Обнулено старых групп: ${stats.cleared} человек`);
  Object.entries(clearedGroups).forEach(([group, count]) => {
    console.log(`     - "${group}" → null: ${count} чел.`);
  });
  console.log(`  ✅ Сохранено новых групп: ${stats.kept} человек`);
  console.log(`  ⏭️  Уже без группы: ${stats.unchanged} человек`);
}

migrateGroups();