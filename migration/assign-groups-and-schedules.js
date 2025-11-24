import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Подключение к Supabase через JS SDK
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Данные для обновления: { фамилия_часть_имени: { group, schedule } }
const athletesData = {
    // Группа А-29
    'Михеев Мих': { group: 'А-29', schedule: 'Вт 9:00, Чт 9:00' },
    'Утробин Ар': { group: 'А-29', schedule: 'Вт 9:00, Чт 9:00' },
    'Финский Тим': { group: 'А-29', schedule: 'Вт 9:00, Чт 9:00, Сб 18:00' },
    'Вахрушев Мих': { group: 'А-29', schedule: 'Вт 9:00, Чт 9:00' },

    // Группа А-218
    'Владыкин': { group: 'А-218', schedule: null },
    'Рудин Никита': { group: 'А-218', schedule: null },
    'Трудолюбов': { group: 'А-218', schedule: null },
    'Дубков': { group: 'А-218', schedule: null },
    'Внукова': { group: 'А-218', schedule: null },
    'Мотошков': { group: 'А-218', schedule: null },
    'Богородский': { group: 'А-218', schedule: null },
    'Каршиев': { group: 'А-218', schedule: null },
    'Чесноков': { group: 'А-218', schedule: 'Самозапись' },
    'Носкова': { group: 'А-218', schedule: null },
    'Вахрушев Сов': { group: 'А-218', schedule: 'Вт 19:00, Чт 19:00, Сб 18:00' },

    // Группа А-219
    'Вежеев': { group: 'А-219', schedule: null },
    'Киселев Святослав': { group: 'А-219', schedule: null },
    'Новоселов': { group: 'А-219', schedule: null },
    'Желудов': { group: 'А-219', schedule: null },
    'Колеватов': { group: 'А-219', schedule: null },

    // Группа М-19
    'Мнацаканян': { group: 'М-19', schedule: null },
    'Байгозин': { group: 'М-19', schedule: null },
    'Бобылев': { group: 'М-19', schedule: null },
    'Дулесов': { group: 'М-19', schedule: null },
    'Хайдаров': { group: 'М-19', schedule: null },

    // Группа М-117
    'Балобанов': { group: 'М-117', schedule: null },
    'Загребин': { group: 'М-117', schedule: null },
    'Кулаков': { group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
    'Ломаев': { group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
    'Какшинский': { group: 'М-117', schedule: 'Пн 17:00, Ср 17:00' },
    'Тумбаков': { group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
    'Стерхов': { group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
    'Хорин': { group: 'М-117', schedule: 'Ср 17:00, Пт 17:00' },
    'Щекотова': { group: 'М-117', schedule: 'Пн 17:00, Ср 17:00' },
    'Тарасов': { group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },
    'Осеев': { group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },
    'Лебедев': { group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },
    'Романов': { group: 'М-117', schedule: null },
    'Касаткин': { group: 'М-117', schedule: 'Ср 17:00, Пт 17:00' },
    'Зайцев Михаил': { group: 'М-117', schedule: 'Пн 17:00, Ср 17:00' },
    'Ризванов': { group: 'М-117', schedule: 'Ср 17:00, Пт 17:00' },
    'Климентьев': { group: 'М-117', schedule: 'Самозапись' },
    'Васильев': { group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },
    'Логинов': { group: 'М-117', schedule: 'Пн 17:00, Ср 17:00, Пт 17:00' },
    'Коновалов': { group: 'М-117', schedule: 'Самозапись' },
    'Поклонов': { group: 'М-117', schedule: 'Пн 17:00, Пт 17:00' },

    // Группа М-118
    'Попков': { group: 'М-118', schedule: 'Пн 9:00, Ср 18:00, Пт 18:00' },
    'Чумаков Дмитрий': { group: 'М-118', schedule: 'Пн 9:00, Ср 18:00, Пт 18:00' },
    'Зеленских Ст': { group: 'М-118', schedule: 'Самозапись' },
    'Зеленских Ал': { group: 'М-118', schedule: 'Самозапись' },
    'Шайгаляммов': { group: 'М-118', schedule: 'Пн 18:00, Ср 18:00' },
    'Скобелев': { group: 'М-118', schedule: 'Пн 18:00, Ср 18:00, Пт 18:00' },
    'Трескин': { group: 'М-118', schedule: 'Пн 18:00, Ср 18:00' },
    'Нурутдинов': { group: 'М-118', schedule: null },
    'Красноперов': { group: 'М-118', schedule: 'Пн 18:00, Ср 18:00, Пт 18:00' },
    'Самойлов': { group: 'М-118', schedule: null }
};

async function assignGroupsAndSchedules() {
    try {
        console.log('✅ Подключение к Supabase через JS SDK');

        // Загрузить всех спортсменов
        const { data: athletes, error: fetchError } = await supabase
            .from('athletes')
            .select('id, name')
            .order('name');

        if (fetchError) {
            throw new Error(`Ошибка загрузки спортсменов: ${fetchError.message}`);
        }

        console.log(`📊 Загружено ${athletes.length} спортсменов`);
        console.log('');

        let updatedCount = 0;
        let notFoundCount = 0;
        const notFound = [];

        // Для каждого паттерна найти спортсмена и обновить
        for (const [namePattern, data] of Object.entries(athletesData)) {
            const athlete = athletes.find(a =>
                a.name.includes(namePattern) ||
                namePattern.split(' ').every(part => a.name.includes(part))
            );

            if (athlete) {
                const { error: updateError } = await supabase
                    .from('athletes')
                    .update({
                        group_name: data.group,
                        schedule: data.schedule,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', athlete.id);

                if (updateError) {
                    console.log(`❌ Ошибка обновления ${athlete.name}: ${updateError.message}`);
                } else {
                    console.log(`✅ ${athlete.name} → ${data.group} | ${data.schedule || 'без расписания'}`);
                    updatedCount++;
                }
            } else {
                console.log(`❌ НЕ НАЙДЕН: "${namePattern}"`);
                notFound.push(namePattern);
                notFoundCount++;
            }
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Обновлено: ${updatedCount} спортсменов`);
        console.log(`❌ Не найдено: ${notFoundCount} спортсменов`);

        if (notFound.length > 0) {
            console.log('');
            console.log('Не найденные спортсмены:');
            notFound.forEach(name => console.log(`  - ${name}`));
        }

        // Показать статистику по группам
        const { data: allAthletes } = await supabase
            .from('athletes')
            .select('group_name')
            .not('group_name', 'is', null)
            .neq('group_name', '');

        const groupCounts = {};
        allAthletes?.forEach(a => {
            groupCounts[a.group_name] = (groupCounts[a.group_name] || 0) + 1;
        });

        console.log('');
        console.log('📊 Статистика по группам:');
        Object.keys(groupCounts).sort().forEach(group => {
            console.log(`  ${group}: ${groupCounts[group]} спортсменов`);
        });

        // Показать статистику по расписанию
        const { data: athletesWithGroups } = await supabase
            .from('athletes')
            .select('schedule')
            .not('group_name', 'is', null)
            .neq('group_name', '');

        const withSchedule = athletesWithGroups.filter(a => a.schedule && a.schedule !== '').length;
        const selfRegistration = athletesWithGroups.filter(a => a.schedule === 'Самозапись').length;
        const noSchedule = athletesWithGroups.filter(a => !a.schedule || a.schedule === '').length;

        console.log('');
        console.log('📅 Статистика по расписанию:');
        console.log(`  С расписанием: ${withSchedule}`);
        console.log(`  Самозапись: ${selfRegistration}`);
        console.log(`  Без расписания: ${noSchedule}`);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        throw error;
    } finally {
        console.log('');
        console.log('✅ Операция завершена');
    }
}

// Запуск
assignGroupsAndSchedules().catch(console.error);
