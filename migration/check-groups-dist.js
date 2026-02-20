import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const {data, error} = await supabase.from('athletes').select('group_name, status');
if (error) { console.error('Error:', error.message); process.exit(1); }

const total = data.length;
const withGroup = data.filter(a => a.group_name && a.group_name !== '').length;

const groups = {};
data.forEach(a => {
    const g = a.group_name || '(null)';
    groups[g] = (groups[g] || 0) + 1;
});

console.log('Всего:', total, '| С группой:', withGroup, '| Без:', total - withGroup);
console.log('\nРаспределение:');
Object.entries(groups).sort((a,b) => b[1]-a[1]).forEach(([g, c]) => console.log('  ' + g + ': ' + c));
