import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.mjkssesvhowmncyctmvs:wlZbQvvlABtCcqzt@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkGroups() {
  await client.connect();

  console.log('🔍 Проверка групп в Supabase...\n');

  // Количество по группам
  const groupCount = await client.query(`
    SELECT group_name, COUNT(*) as count
    FROM athletes
    GROUP BY group_name
    ORDER BY count DESC
  `);

  console.log('📊 Распределение по группам:');
  groupCount.rows.forEach(row => {
    console.log(`  ${row.group_name || '(null)'}: ${row.count} спортсменов`);
  });

  console.log('\n📋 Первые 10 спортсменов с группами:');
  const withGroups = await client.query(`
    SELECT name, group_name
    FROM athletes
    WHERE group_name IS NOT NULL
    LIMIT 10
  `);
  withGroups.rows.forEach(row => {
    console.log(`  ${row.name}: ${row.group_name}`);
  });

  await client.end();
}

checkGroups().catch(console.error);
