import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data } = await supabase.from('athletes').select('id, name, group_name').order('name');

console.log('🔍 Поиск не найденных спортсменов:\n');

// Ищем похожие имена
const searches = ['Богородский', 'Новосёлов', 'Новоселов', 'Щёкотова', 'Щекотова', 'Шайгалля', 'Шайгалл'];

searches.forEach(search => {
  const found = data.filter(a => a.name.includes(search));
  if (found.length > 0) {
    console.log(`\n"${search}":`);
    found.forEach(a => console.log(`  - ${a.name} (группа: ${a.group_name || 'нет'})`));
  }
});