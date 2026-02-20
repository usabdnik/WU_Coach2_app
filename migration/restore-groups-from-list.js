import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Данные из списка пользователя (Октябрь)
const GROUP_ASSIGNMENTS = {
  'А-29': [
    'Михеев Михаил',
    'Утробин Артём',
    'Финский Тимофей',
    'Вахрушев Михаил Денисович', // Уточнить: может быть другой Вахрушев
  ],
  'А-218': [
    'Владыкин Лев',
    'Рудин Никита',
    'Трудолюбов Лев',
    'Дубков Богдан',
    'Внукова Софья',
    'Мотошков Антон',
    // 'Богородский Макар', // Не найден в базе - возможно, отсутствует
    'Каршиев Захар',
    'Чесноков Александр',
    'Носкова Алиса',
    'Вахрушев Савелий', // Вахрушев Соведий = Савелий
  ],
  'А-219': [
    'Вежеев Андрей',
    'Киселев Святослав',
    'Новосёлов Дмитрий', // С буквой ё
    'Желудов Михаил',
    'Колеватов Иван',
  ],
  'М-19': [
    'Мнацаканян Марк', // ПБ = ?
    'Байгозин',
    'Бобылев',
    'Дулесов',
    'Хайдаров',
  ],
  'М-117': [
    'Балобанов',
    'Загребин',
    'Кулаков',
    'Ломаев',
    'Какшинский',
    'Тумбаков',
    'Стерхов',
    'Хорин',
    'Щёкотова', // С буквой ё
    'Тарасов',
    'Осеев',
    'Лебедев',
    'Романов',
    'Касаткин Ярослав',
    'Зайцев Михаил',
    'Ризванов',
    'Клементьев', // Климентьев
    'Васильев',
    'Логинов',
    'Коновалов',
    'Поклонов Егор',
  ],
  'М-118': [
    'Попков',
    'Чумаков Дмитрий',
    'Зеленских Степан',
    'Зеленских Алексей',
    'Шайгаллямов', // Правильное написание
    'Скобелев',
    'Трескин',
    'Нурутдинов',
    'Красноперов Михаил',
    'Самойлов Роман',
  ]
};

// Функция нечеткого поиска по фамилии/имени
function findAthlete(athletes, searchName) {
  // Точный поиск
  let found = athletes.find(a => a.name === searchName);
  if (found) return found;

  // Поиск по началу имени (для сокращенных)
  found = athletes.find(a => a.name.startsWith(searchName));
  if (found) return found;

  // Поиск по фамилии (первое слово)
  const searchLastName = searchName.split(' ')[0];
  const candidates = athletes.filter(a => a.name.startsWith(searchLastName));
  
  if (candidates.length === 1) return candidates[0];
  
  // Если несколько кандидатов - ищем по имени
  if (candidates.length > 1 && searchName.includes(' ')) {
    const searchFirstName = searchName.split(' ')[1];
    found = candidates.find(a => a.name.includes(searchFirstName));
    if (found) return found;
  }

  return null;
}

async function restoreGroups() {
  console.log('🔄 Восстановление групп из списка...\n');

  // Получаем всех спортсменов
  const { data: athletes, error: fetchError } = await supabase
    .from('athletes')
    .select('id, name, group_name');

  if (fetchError) {
    console.error('❌ Ошибка загрузки:', fetchError.message);
    return;
  }

  console.log(`📊 Всего спортсменов в базе: ${athletes.length}\n`);

  let updated = 0;
  let notFound = 0;
  let ambiguous = 0;

  // Назначаем группы
  for (const [groupName, athleteNames] of Object.entries(GROUP_ASSIGNMENTS)) {
    console.log(`\n📋 Группа: ${groupName} (${athleteNames.length} человек)`);

    for (const searchName of athleteNames) {
      const athlete = findAthlete(athletes, searchName);

      if (!athlete) {
        console.warn(`   ⚠️  НЕ НАЙДЕН: "${searchName}"`);
        notFound++;
        continue;
      }

      // Проверяем, не изменилась ли уже группа
      if (athlete.group_name === groupName) {
        console.log(`   ⏭️  ${athlete.name} (уже ${groupName})`);
        continue;
      }

      console.log(`   ✅ ${athlete.name} → ${groupName}`);

      const { error: updateError } = await supabase
        .from('athletes')
        .update({ group_name: groupName })
        .eq('id', athlete.id);

      if (updateError) {
        console.error(`      ❌ Ошибка: ${updateError.message}`);
      } else {
        updated++;
      }
    }
  }

  console.log('\n✅ Восстановление завершено!');
  console.log(`   ✅ Обновлено: ${updated} человек`);
  console.log(`   ⚠️  Не найдено: ${notFound} человек`);
  
  if (notFound > 0) {
    console.log('\n⚠️  ВАЖНО: Проверьте не найденных спортсменов выше');
    console.log('   Возможно, нужно скорректировать имена в скрипте');
  }
}

restoreGroups();