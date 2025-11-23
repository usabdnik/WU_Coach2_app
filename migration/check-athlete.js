/**
 * Check specific athlete in Supabase
 * Usage: node migration/check-athlete.js "Актямов Тимур"
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const searchName = process.argv[2] || 'Актямов Тимур';

async function main() {
  console.log(`🔍 Поиск спортсмена: "${searchName}"\n`);

  // Exact match
  const { data: exact } = await supabase
    .from('athletes')
    .select('*')
    .eq('name', searchName);

  if (exact && exact.length > 0) {
    console.log('✅ НАЙДЕН (точное совпадение):');
    exact.forEach(a => {
      console.log(`   ID: ${a.id}`);
      console.log(`   Имя: ${a.name}`);
      console.log(`   Группа: ${a.group_name || 'не указана'}`);
      console.log(`   Moyklass ID: ${a.moyklass_id || 'нет'}`);
      console.log(`   Создан: ${a.created_at}`);
    });
  } else {
    console.log('❌ Точное совпадение не найдено');
  }

  // Partial match (case-insensitive)
  console.log('\n📋 Поиск похожих имён...');
  const { data: similar } = await supabase
    .from('athletes')
    .select('id, name, group_name')
    .ilike('name', `%${searchName.split(' ')[0]}%`);

  if (similar && similar.length > 0) {
    console.log(`Найдено ${similar.length} похожих:`);
    similar.forEach(a => {
      console.log(`   - ${a.name} (группа: ${a.group_name || 'нет'})`);
    });
  } else {
    console.log('   Похожих не найдено');
  }

  // Total athletes count
  const { count } = await supabase
    .from('athletes')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Всего спортсменов в базе: ${count}`);
}

main().catch(console.error);
