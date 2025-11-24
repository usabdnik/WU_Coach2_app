import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function updateVakhurushev() {
    try {
        const { data, error } = await supabase
            .from('athletes')
            .update({
                group_name: 'А-218',
                schedule: 'Вт 19:00, Чт 19:00, Сб 18:00',
                updated_at: new Date().toISOString()
            })
            .eq('name', 'Вахрушев Савелий Александрович')
            .select();

        if (error) throw new Error(error.message);

        console.log('✅ Вахрушев Савелий Александрович → А-218 | Вт 19:00, Чт 19:00, Сб 18:00');
        console.log('Обновлено:', data);

    } catch (error) {
        console.error('❌', error.message);
    }
}

updateVakhurushev();
