import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  // Найти по textSearch
  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, name')
    .ilike('name', '%Актямов%');

  console.log('Результат поиска:', athletes?.length || 0, error?.message || '');
  if (!athletes || athletes.length === 0) {
    console.log('❌ Не найден');
    return;
  }

  const athlete = athletes[0];
  console.log(`👤 ${athlete.name}`);
  console.log(`   UUID: ${athlete.id}\n`);

  // Подписки
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('athlete_id', athlete.id)
    .order('end_date', { ascending: false });

  if (!subs || subs.length === 0) {
    console.log('📋 ПОДПИСОК: 0\n');
    console.log('⚠️  У Актямова НЕТ абонементов в Supabase!');
    console.log('   Если включен фильтр "💳 С подпиской" - он скрыт.');
    console.log('   Выключите фильтр, и он появится.');
  } else {
    console.log(`📋 Подписки (${subs.length}):`);
    subs.forEach((sub, i) => {
      console.log(`${i+1}. ${sub.start_date} → ${sub.end_date}`);
    });
    console.log(`\n📅 ПОСЛЕДНИЙ АБОНЕМЕНТ ИСТЁК: ${subs[0].end_date}`);
  }
}

main().catch(console.error);
