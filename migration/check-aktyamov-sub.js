import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  // Прямой поиск Актямова
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, name, moyklass_id')
    .eq('name', 'Актямов Тимур Маратович')
    .single();

  if (!athlete) {
    console.log('❌ Актямов Тимур Маратович не найден');
    return;
  }

  console.log(`👤 ${athlete.name}`);
  console.log(`   ID: ${athlete.id}`);
  console.log(`   Moyklass ID: ${athlete.moyklass_id || 'нет'}\n`);

  // Подписки
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('athlete_id', athlete.id)
    .order('end_date', { ascending: false });

  if (error) {
    console.log('❌ Ошибка:', error.message);
    return;
  }

  if (!subs || subs.length === 0) {
    console.log('📋 Подписок: НЕТ\n');
    console.log('⚠️  Актямов Тимур НЕ ИМЕЕТ абонементов в базе');
    console.log('   Если фильтр "💳 С подпиской" активен - он не отображается!');
    return;
  }

  console.log(`📋 Подписки (${subs.length}):`);
  subs.forEach((sub, i) => {
    const status = new Date(sub.end_date) >= new Date() ? '✅ АКТИВЕН' : '❌ ИСТЁК';
    console.log(`${i + 1}. ${sub.start_date} → ${sub.end_date} | ${status}`);
  });

  console.log(`\n📅 ПОСЛЕДНИЙ: ${subs[0].end_date}`);
}

main().catch(console.error);
