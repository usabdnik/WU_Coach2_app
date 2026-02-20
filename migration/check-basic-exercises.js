import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data, error } = await supabase
  .from('exercises')
  .select('*')
  .or('name.ilike.%подтяг%,name.ilike.%брусь%,name.ilike.%пол%');

if (error) {
  console.error('Ошибка:', error.message);
} else {
  console.log('Найденные базовые упражнения:');
  data.forEach(e => console.log(`  - ${e.name} (ID: ${e.id})`));
}
