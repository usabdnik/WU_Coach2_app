import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const searchPatterns = [
    'Богородский',
    'Вахрушев',
    'Новоселов',
    'Щекотов',
    'Климентьев',
    'Шайгат'
];

async function findMissingAthletes() {
    try {
        const { data: athletes, error } = await supabase
            .from('athletes')
            .select('id, name')
            .order('name');

        if (error) throw new Error(error.message);

        console.log(`📊 Поиск среди ${athletes.length} спортсменов\n`);

        searchPatterns.forEach(pattern => {
            console.log(`🔍 "${pattern}":`);
            const matches = athletes.filter(a =>
                a.name.toLowerCase().includes(pattern.toLowerCase())
            );

            if (matches.length > 0) {
                matches.forEach(m => console.log(`  ✅ ${m.name}`));
            } else {
                console.log(`  ❌ Не найдено`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('❌', error.message);
    }
}

findMissingAthletes();
