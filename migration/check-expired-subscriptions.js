import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`📅 Сегодня: ${today}\n`);

  // Активные (end_date >= сегодня)
  const { count: active } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .gte('end_date', today);

  // Истёкшие (end_date < сегодня)
  const { count: expired } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .lt('end_date', today);

  // NULL (неизвестно)
  const { count: unknown } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .is('end_date', null);

  console.log(`📊 Статистика подписок:`);
  console.log(`   ✅ Активные: ${active}`);
  console.log(`   ❌ Истёкшие: ${expired}`);
  console.log(`   ❓ Неизвестно (NULL): ${unknown}\n`);

  // Примеры истёкших
  const { data: expiredSubs } = await supabase
    .from('subscriptions')
    .select('athlete_id, start_date, end_date')
    .lt('end_date', today)
    .order('end_date', { ascending: false })
    .limit(10);

  if (expiredSubs && expiredSubs.length > 0) {
    console.log('📋 ИСТЁКШИЕ подписки (последние 10):');
    for (const sub of expiredSubs) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('name')
        .eq('id', sub.athlete_id)
        .single();

      const endDate = new Date(sub.end_date);
      const daysAgo = Math.ceil((new Date() - endDate) / (1000 * 60 * 60 * 24));

      console.log(`   ${athlete?.name || 'Unknown'}`);
      console.log(`      ${sub.start_date} → ${sub.end_date} (истёк ${daysAgo} дней назад)`);
    }
  } else {
    console.log('❌ Нет истёкших подписок');
  }

  // Самые старые истёкшие
  const { data: oldest } = await supabase
    .from('subscriptions')
    .select('athlete_id, start_date, end_date')
    .lt('end_date', today)
    .order('end_date', { ascending: true })
    .limit(5);

  if (oldest && oldest.length > 0) {
    console.log('\n📋 САМЫЕ ДАВНО ИСТЁКШИЕ:');
    for (const sub of oldest) {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('name')
        .eq('id', sub.athlete_id)
        .single();

      console.log(`   ${athlete?.name || 'Unknown'}: истёк ${sub.end_date}`);
    }
  }
}

main().catch(console.error);
