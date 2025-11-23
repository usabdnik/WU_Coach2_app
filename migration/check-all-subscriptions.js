import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  // Всего подписок
  const { count: total } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Всего подписок в базе: ${total}\n`);

  // Подписки с end_date
  const { count: withEndDate } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .not('end_date', 'is', null);

  console.log(`✅ С датой окончания: ${withEndDate}`);

  // Подписки без end_date
  const { count: withoutEndDate } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .is('end_date', null);

  console.log(`❌ Без даты окончания (NULL): ${withoutEndDate}\n`);

  // Примеры с датами
  const { data: withDates } = await supabase
    .from('subscriptions')
    .select('athlete_id, start_date, end_date')
    .not('end_date', 'is', null)
    .order('end_date', { ascending: false })
    .limit(5);

  if (withDates && withDates.length > 0) {
    console.log('📋 Примеры подписок С датой окончания:');
    for (const sub of withDates) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('name')
        .eq('id', sub.athlete_id)
        .single();
      console.log(`   ${athlete?.name || 'Unknown'}: ${sub.start_date} → ${sub.end_date}`);
    }
  } else {
    console.log('❌ НЕТ подписок с датой окончания!');
  }

  // Примеры без дат
  const { data: withoutDates } = await supabase
    .from('subscriptions')
    .select('athlete_id, start_date, end_date')
    .is('end_date', null)
    .limit(5);

  if (withoutDates && withoutDates.length > 0) {
    console.log('\n📋 Примеры подписок БЕЗ даты окончания:');
    for (const sub of withoutDates) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('name')
        .eq('id', sub.athlete_id)
        .single();
      console.log(`   ${athlete?.name || 'Unknown'}: ${sub.start_date} → NULL`);
    }
  }
}

main().catch(console.error);
