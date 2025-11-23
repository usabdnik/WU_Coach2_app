/**
 * Check athlete's subscription history
 * Usage: node migration/check-subscription.js "Актямов"
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const searchName = process.argv[2] || 'Актямов';

async function main() {
  console.log(`🔍 Поиск подписок для: "${searchName}"\n`);

  // Find athlete
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, name, moyklass_id')
    .ilike('name', `%${searchName}%`);

  if (!athletes || athletes.length === 0) {
    console.log('❌ Спортсмен не найден');
    return;
  }

  for (const athlete of athletes) {
    console.log(`👤 ${athlete.name}`);
    console.log(`   ID: ${athlete.id}`);
    console.log(`   Moyklass ID: ${athlete.moyklass_id || 'нет'}\n`);

    // Get subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('athlete_id', athlete.id)
      .order('end_date', { ascending: false });

    if (!subs || subs.length === 0) {
      console.log('   📋 Подписок: НЕТ\n');
      continue;
    }

    console.log(`   📋 Подписки (${subs.length}):`);
    subs.forEach((sub, i) => {
      const status = new Date(sub.end_date) >= new Date() ? '✅ АКТИВЕН' : '❌ ИСТЁК';
      console.log(`   ${i + 1}. ${sub.start_date} → ${sub.end_date} | ${status}`);
      if (sub.subscription_name) {
        console.log(`      Название: ${sub.subscription_name}`);
      }
      if (sub.visits_left !== null) {
        console.log(`      Осталось визитов: ${sub.visits_left}`);
      }
    });

    // Last subscription
    const lastSub = subs[0];
    const endDate = new Date(lastSub.end_date);
    const today = new Date();

    console.log('\n   📅 ПОСЛЕДНИЙ АБОНЕМЕНТ:');
    console.log(`      Дата окончания: ${lastSub.end_date}`);

    if (endDate >= today) {
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      console.log(`      Статус: ✅ АКТИВЕН (осталось ${daysLeft} дней)`);
    } else {
      const daysAgo = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));
      console.log(`      Статус: ❌ ИСТЁК ${daysAgo} дней назад`);
    }

    console.log('');
  }
}

main().catch(console.error);
