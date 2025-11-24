import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function checkSchema() {
    try {
        // Get one athlete to see the structure
        const { data, error } = await supabase
            .from('athletes')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Ошибка:', error.message);
            return;
        }

        console.log('📊 Структура таблицы athletes:');
        console.log('');

        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            columns.forEach(col => {
                console.log(`  - ${col}: ${typeof data[0][col]}`);
            });
        }

        console.log('');
        console.log('✅ Проверка завершена');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

checkSchema();
