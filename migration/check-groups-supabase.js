import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './migration/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkGroups() {
  console.log('🔍 Проверка групп в Supabase...\n');

  // Получаем всех спортсменов
  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, name, group_name')
    .order('name');

  if (error) {
    console.error('❌ Ошибка:', error);
    return;
  }

  // Подсчёт по группам
  const groupCounts = {};
  athletes.forEach(a => {
    const group = a.group_name || '(null)';
    groupCounts[group] = (groupCounts[group] || 0) + 1;
  });

  console.log('📊 Распределение по группам:');
  Object.entries(groupCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([group, count]) => {
      console.log(`  ${group}: ${count} спортсменов`);
    });

  console.log(`\n📋 Всего спортсменов: ${athletes.length}`);

  console.log('\n🔴 Спортсмены БЕЗ группы (null):');
  const noGroup = athletes.filter(a => !a.group_name);
  noGroup.slice(0, 10).forEach(a => {
    console.log(`  - ${a.name}`);
  });
  console.log(`  ...и ещё ${Math.max(0, noGroup.length - 10)} спортсменов`);

  console.log('\n✅ Спортсмены С группой (первые 10):');
  const withGroup = athletes.filter(a => a.group_name);
  withGroup.slice(0, 10).forEach(a => {
    console.log(`  - ${a.name}: ${a.group_name}`);
  });
}

checkGroups().catch(console.error);
