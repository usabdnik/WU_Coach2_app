import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('🧪 ТЕСТ: Установка группы Актямову');

const { data: athletes } = await supabase
  .from('athletes')
  .select('id, name, group_name')
  .ilike('name', '%Актямов%');

if (athletes.length === 0) {
  console.log('❌ Не найден');
  process.exit(1);
}

const aktyamov = athletes[0];
console.log('📋 ДО:', aktyamov.name, '- group_name:', aktyamov.group_name);

const { data: updated, error } = await supabase
  .from('athletes')
  .update({ group_name: 'М-117' })
  .eq('id', aktyamov.id)
  .select();

if (error) {
  console.log('❌ Ошибка:', error.message);
  process.exit(1);
}

console.log('✅ ПОСЛЕ UPDATE:', updated[0].name, '- group_name:', updated[0].group_name);

const { data: check } = await supabase
  .from('athletes')
  .select('name, group_name')
  .eq('id', aktyamov.id)
  .single();

console.log('🔍 Проверка в базе:', check.name, '- group_name:', check.group_name);
