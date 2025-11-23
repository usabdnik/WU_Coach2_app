import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkGroups() {
  console.log('🔍 Проверка данных группы в Supabase...\n');

  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, name, group_name')
    .order('name');

  if (error) {
    console.error('❌ Ошибка:', error.message);
    return;
  }

  console.log(`📊 Всего спортсменов: ${athletes.length}\n`);

  // Группируем по group_name
  const groupCounts = {};
  const withoutGroup = [];

  athletes.forEach(athlete => {
    if (athlete.group_name) {
      groupCounts[athlete.group_name] = (groupCounts[athlete.group_name] || 0) + 1;
    } else {
      withoutGroup.push(athlete.name);
    }
  });

  console.log('📈 Статистика по группам:');
  Object.entries(groupCounts).forEach(([group, count]) => {
    console.log(`  ${group}: ${count} человек`);
  });

  console.log(`\n⚠️  Без группы: ${withoutGroup.length} человек`);
  if (withoutGroup.length > 0) {
    console.log('\n👤 Список спортсменов без группы:');
    withoutGroup.slice(0, 10).forEach(name => {
      console.log(`  - ${name}`);
    });
    if (withoutGroup.length > 10) {
      console.log(`  ... и ещё ${withoutGroup.length - 10}`);
    }
  }
}

checkGroups();