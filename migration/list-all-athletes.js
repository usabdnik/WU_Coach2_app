import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const { data } = await supabase
    .from('athletes')
    .select('name')
    .order('name')
    .limit(20);

  console.log('Первые 20 спортсменов:');
  data.forEach((a, i) => console.log(`${i+1}. ${a.name}`));

  // Поиск Акт*
  const { data: akt } = await supabase
    .from('athletes')
    .select('name')
    .like('name', 'Акт%');

  console.log('\nНачинаются с "Акт":');
  if (akt && akt.length > 0) {
    akt.forEach(a => console.log(`  - ${a.name}`));
  } else {
    console.log('  Никого нет');
  }
}

main().catch(console.error);
