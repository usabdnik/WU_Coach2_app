/**
 * Import exercises from Google Sheets to Supabase
 *
 * Usage:
 *   node migration/import-exercises-from-sheets.js
 *
 * Prerequisites:
 *   1. Make Google Sheet publicly viewable (Share → Anyone with link → Viewer)
 *   2. Or export range Y:AA as CSV file
 *   3. Run migration first: psql -f supabase/migrations/20251116000004_add_score_to_exercises.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';
import https from 'https';

// Load environment variables
config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Google Sheets configuration
const SPREADSHEET_ID = '1bMcieNxHAnd7GUEAQeKuGEgf1AIvqVAYAq-Rsl7qdxs';
const SHEET_NAME = 'Export'; // Sheet name
const RANGE = 'Y3:AA700'; // Start from row 3, skip headers (Y=Элементы, Z=Балл, AA=Структура)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Fetch CSV from Google Sheets public URL
 */
async function fetchFromGoogleSheets() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}&range=${RANGE}`;

  console.log('📥 Fetching from Google Sheets...');
  console.log(`   URL: ${url}`);

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          let data = '';
          redirectResponse.on('data', chunk => data += chunk);
          redirectResponse.on('end', () => resolve(data));
          redirectResponse.on('error', reject);
        });
      } else if (response.statusCode === 200) {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
        response.on('error', reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', reject);
  });
}

/**
 * Parse CSV data into exercises array
 */
function parseCSV(csvData) {
  // First, properly split CSV respecting quoted newlines
  const rows = [];
  let currentRow = '';
  let inQuotes = false;

  for (let i = 0; i < csvData.length; i++) {
    const char = csvData[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentRow += char;
    } else if (char === '\n' && !inQuotes) {
      if (currentRow.trim()) rows.push(currentRow.trim());
      currentRow = '';
    } else {
      currentRow += char;
    }
  }
  if (currentRow.trim()) rows.push(currentRow.trim());

  const exercises = [];

  // Process all rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // Parse CSV row (handle quoted values with newlines)
    const values = parseCSVLine(row);

    if (values.length >= 3) {
      const [name, scoreStr, type] = values;

      // Skip empty names or header-like rows
      if (!name || name === 'Элементы' || name === '660' || name === '"Элементы"') continue;

      // Handle Russian decimal format (5,5 → 5.5) and clean name (remove internal newlines)
      const cleanName = name.replace(/\n/g, ' ').trim();
      const score = parseFloat(scoreStr.replace(',', '.')) || 1;
      const cleanType = type || 'Статика';

      exercises.push({
        name: cleanName,
        score: score,
        type: cleanType.trim(),
        category: determineCategory(cleanType.trim()),
        unit: 'count'
      });
    }
  }

  return exercises;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  // Push last value
  values.push(current.trim().replace(/^"|"$/g, ''));

  return values;
}

/**
 * Determine category based on type
 */
function determineCategory(type) {
  const typeMap = {
    'Статика': 'static',
    'Динамика': 'dynamic',
    'Сила': 'strength',
    'Гибкость': 'flexibility',
    'Акробатика': 'acrobatics'
  };

  return typeMap[type] || 'general';
}

/**
 * Import exercises using UPSERT (safe - preserves existing data)
 *
 * ⚠️  NEVER DELETE ALL - this causes CASCADE DELETE on performances!
 * Instead, use UPSERT to update existing and add new exercises.
 */
async function importExercises(exercises) {
  console.log(`\n📊 Parsed ${exercises.length} exercises`);

  if (exercises.length === 0) {
    console.error('❌ No exercises found to import');
    return;
  }

  // Show sample
  console.log('\n📋 Sample exercises:');
  exercises.slice(0, 5).forEach((ex, i) => {
    console.log(`   ${i + 1}. ${ex.name} (Балл: ${ex.score}, Тип: ${ex.type})`);
  });

  // Check current exercises count
  const { count: beforeCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Текущее количество exercises: ${beforeCount}`);

  // UPSERT exercises (safe approach - no data loss)
  console.log('\n📤 Импорт exercises (UPSERT)...');
  console.log('   ⚠️  ВАЖНО: Существующие exercises сохраняются!');

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Process one by one for accurate counting (slower but safer)
  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    // Check if exists
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', exercise.name)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('exercises')
        .update({
          score: exercise.score,
          type: exercise.type,
          category: exercise.category,
          unit: exercise.unit
        })
        .eq('id', existing.id);

      if (error) {
        errors++;
        console.error(`   ❌ Ошибка обновления ${exercise.name}:`, error.message);
      } else {
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('exercises')
        .insert(exercise);

      if (error) {
        errors++;
        console.error(`   ❌ Ошибка добавления ${exercise.name}:`, error.message);
      } else {
        inserted++;
      }
    }

    // Progress indicator every 100 exercises
    if ((i + 1) % 100 === 0) {
      console.log(`   Прогресс: ${i + 1}/${exercises.length} (добавлено: ${inserted}, обновлено: ${updated})`);
    }
  }

  // Final count
  const { count: afterCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Импорт завершён:`);
  console.log(`   Добавлено: ${inserted}`);
  console.log(`   Обновлено: ${updated}`);
  console.log(`   Ошибок: ${errors}`);
  console.log(`   Было exercises: ${beforeCount}`);
  console.log(`   Стало exercises: ${afterCount}`);
  console.log(`\n   ✅ Все существующие performances сохранены!`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting exercises import from Google Sheets\n');
  console.log('📄 Spreadsheet ID:', SPREADSHEET_ID);
  console.log('📊 Range:', RANGE);

  try {
    // Check for local CSV file first
    const localCSV = 'migration/exercises.csv';
    let csvData;

    if (existsSync(localCSV)) {
      console.log(`\n📁 Found local CSV file: ${localCSV}`);
      csvData = readFileSync(localCSV, 'utf-8');
    } else {
      console.log('\n⚠️  No local CSV file found. Trying Google Sheets public URL...');
      console.log('   ℹ️  Make sure sheet is publicly viewable (Share → Anyone with link)');
      csvData = await fetchFromGoogleSheets();
    }

    // Parse and import
    const exercises = parseCSV(csvData);
    await importExercises(exercises);

    console.log('\n🎉 Import completed!');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Ensure Google Sheet is publicly viewable');
    console.log('   2. Or export Y:AA columns as CSV to migration/exercises.csv');
    console.log('   3. Check SPREADSHEET_ID and RANGE are correct');
  }
}

main();
