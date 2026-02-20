#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
  const { data: all } = await supabase.from('athletes').select('group_name');

  const groupCounts = {};
  all.forEach(a => {
    const group = a.group_name || 'NULL';
    groupCounts[group] = (groupCounts[group] || 0) + 1;
  });

  console.log('📊 Текущая статистика по группам:');
  Object.entries(groupCounts).sort((a, b) => b[1] - a[1]).forEach(([group, count]) => {
    console.log(`  ${group}: ${count}`);
  });

  const total = all.length;
  const withGroups = all.filter(a => a.group_name).length;
  const noGroups = all.filter(a => !a.group_name).length;

  console.log('');
  console.log(`✅ Всего спортсменов: ${total}`);
  console.log(`✅ С группами: ${withGroups}`);
  console.log(`⚠️  Без групп (NULL): ${noGroups}`);
})();
