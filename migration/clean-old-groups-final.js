import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Новые правильные группы
const NEW_GROUPS = ['М-19', 'М-117', 'М-118', 'А-29', 'А-218', 'А-219'];

// Старые группы из Moyklass (нужно удалить)
const OLD_GROUPS = ['Начинающие', 'Средняя', 'Продвинутая', 'Элитная', 'Базовая', 'Основная'];

async function cleanOldGroups() {
  console.log('🧹 Очистка старых групп из Moyklass...\n');

  // Получаем всех спортсменов со старыми группами
  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, name, group_name')
    .in('group_name', OLD_GROUPS);

  if (error) {
    console.error('❌ Ошибка:', error.message);
    return;
  }

  console.log(`📊 Найдено ${athletes.length} спортсменов со старыми группами\n`);

  let cleaned = 0;

  for (const athlete of athletes) {
    console.log(`🔄 ${athlete.name}: "${athlete.group_name}" → null`);

    const { error: updateError } = await supabase
      .from('athletes')
      .update({ group_name: null })
      .eq('id', athlete.id);

    if (updateError) {
      console.error(`   ❌ Ошибка: ${updateError.message}`);
    } else {
      cleaned++;
    }
  }

  console.log('\n✅ Очистка завершена!');
  console.log(`   Очищено: ${cleaned} человек`);
}

cleanOldGroups();