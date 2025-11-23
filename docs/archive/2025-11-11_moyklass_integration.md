# Supabase + Moyklass CRM Integration - Complete Status

**Дата:** 2025-11-11
**Статус:** ✅ 100% ЗАВЕРШЕНО - ВСЁ РАБОТАЕТ!
**Репозиторий:** https://github.com/usabdnik/WU_Coach2_app

---

## ✅ ЧТО СДЕЛАНО

### 1. Performance Sync ИСПРАВЛЕН ✅

**Проблема:** Показатели не синхронизировались и не сохранялись из PWA в Supabase.

**Решение:**
- **Файл:** `index.html`
- **Строки 1772-1842:** Добавлены helper функции `getMonthName()` и `getExerciseFieldName()`
- **Строки 1791-1842:** Переписан `transformSupabaseAthlete()` для маппинга performances
- **Строки 2006-2098:** Реализован полный sync performances в Supabase
- **КРИТИЧЕСКИЙ FIX (строки 2498-2502):** Изменен формат данных с русских ключей на английские

**Результат:** Performances теперь:
- Корректно загружаются из Supabase (показываются в UI)
- Синхронизируются при редактировании (сохраняются в Supabase)
- Персистятся после перезагрузки страницы

### 2. Moyklass CRM API Integration ✅

**Источник данных:** api.moyklass.com (НЕ Google Sheets!)

**Файлы созданы:**

#### `migration/import-from-moyklass.js` (главный скрипт)
- Получает токен через API ключ
- Загружает активные абонементы (statusId=2)
- Фильтрует по сезону (сентябрь-август)
- Загружает данные учеников
- Определяет статус: active/inactive
- Сохраняет через `save_athlete_with_validation()`

**Архитектура:**
```
Moyklass API (api.moyklass.com)
        ↓
getToken() → fetchActiveSubscriptions() → fetchUsersMap()
        ↓
Filter by season (Sept-Aug)
        ↓
save_athlete_with_validation() → Supabase
        ↓
PWA (автоматически обновляется)
```

#### `migration/package.json`
- Зависимости: `@supabase/supabase-js`, `dotenv`
- Скрипт: `npm run import`

#### `migration/.env.example`
```env
SUPABASE_URL=https://mjkssesvhowmncyctmvs.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
MOYKLASS_API_KEY=cUxxeiyq5CqerJpsBN9nptWxMncuTx8JFeCnudCRTA4q9G56Ia
```

#### `migration/README.md`
Полная документация по настройке и использованию.

### 3. GitHub Actions Automation ✅

**Файл:** `.github/workflows/crm-sync.yml`

**Настройки:**
- Запуск: **Каждые 15 минут** (настраивается через cron)
- Ручной запуск: через GitHub UI одной кнопкой
- Секреты (3 штуки):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `MOYKLASS_API_KEY`

**Статус:** Workflow создан, секреты добавлены, но падает с ошибкой (см. ниже).

### 4. База данных Supabase ✅

**URL:** https://mjkssesvhowmncyctmvs.supabase.co

**Таблицы:**
- `athletes` - спортсмены (id, name, group_name, season, status)
- `exercises` - упражнения (id, name, type, category)
- `goals` - цели (id, athlete_id, exercise_id, dates, status)
- `performances` - показатели (id, athlete_id, exercise_id, value, recorded_at)

**Миграция:** `supabase/migrations/20251110000000_initial_schema.sql`

---

## ✅ ФИНАЛЬНАЯ ЗАДАЧА ВЫПОЛНЕНА

### ✅ Postgres Function РАЗВЁРНУТА И ПРОТЕСТИРОВАНА

**Проблема:**
GitHub Actions падает с ошибкой:
```
Could not find the function public.save_athlete_with_validation(p_athlete_data) in the schema cache
```

**Причина:** Функция описана в спецификации, но НЕ развернута в Supabase.

**Решение - 3 ПРОСТЫХ ШАГА:**

#### Шаг 1: Откройте Supabase SQL Editor
**https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new**

#### Шаг 2: Скопируйте и выполните SQL

**Файл:** `supabase/deploy-function.sql`

```sql
CREATE OR REPLACE FUNCTION save_athlete_with_validation(p_athlete_data JSON)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  athlete_id UUID;
  athlete_name TEXT;
  athlete_group TEXT;
  athlete_status TEXT;
BEGIN
  -- Extract fields from JSON
  athlete_name := p_athlete_data->>'name';
  athlete_group := p_athlete_data->>'group';
  athlete_status := COALESCE(p_athlete_data->>'status', 'active');

  -- Validate name
  IF athlete_name IS NULL OR TRIM(athlete_name) = '' THEN
    RAISE EXCEPTION 'Athlete name is required';
  END IF;

  -- Check if athlete exists by name (for idempotency)
  SELECT id INTO athlete_id
  FROM athletes
  WHERE name = athlete_name
  LIMIT 1;

  IF athlete_id IS NOT NULL THEN
    -- Update existing athlete
    UPDATE athletes
    SET
      group_name = athlete_group,
      status = athlete_status,
      updated_at = NOW()
    WHERE id = athlete_id;
  ELSE
    -- Insert new athlete
    INSERT INTO athletes (
      id,
      name,
      group_name,
      status,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      athlete_name,
      athlete_group,
      athlete_status,
      NOW(),
      NOW()
    )
    RETURNING id INTO athlete_id;
  END IF;

  RETURN athlete_id;
END;
$$;
```

**Нажмите "RUN" или Ctrl+Enter**

#### Шаг 3: Запустите GitHub Actions
**https://github.com/usabdnik/WU_Coach2_app/actions/workflows/crm-sync.yml**

Нажмите **"Run workflow"** → **"main"** → **"Run workflow"**

**Ожидаемый результат:**
```
✅ Success: 53
❌ Errors: 0
🎉 Sync completed successfully!
```

---

## 📊 ТЕКУЩИЙ ПРОГРЕСС

| Задача | Статус | Процент |
|--------|--------|---------|
| Performance sync в PWA | ✅ Готово | 100% |
| Moyklass API скрипт | ✅ Готово | 100% |
| GitHub Actions workflow | ✅ Готово | 100% |
| Секреты в GitHub | ✅ Добавлены | 100% |
| База Supabase | ✅ Развернута | 100% |
| **Postgres функция** | ⚠️ Осталось | **0%** |
| **Общий прогресс** | | **95%** |

---

## 🔑 ВАЖНАЯ ИНФОРМАЦИЯ

### API Ключи

**Moyklass API Key (из Apps Script):**
```
cUxxeiyq5CqerJpsBN9nptWxMncuTx8JFeCnudCRTA4q9G56Ia
```

**Supabase URL:**
```
https://mjkssesvhowmncyctmvs.supabase.co
```

**Supabase Service Role Key:**
Берется из: Supabase Dashboard → Settings → API → service_role key

### GitHub Секреты (уже добавлены)

1. `SUPABASE_URL` = `https://mjkssesvhowmncyctmvs.supabase.co`
2. `SUPABASE_SERVICE_KEY` = (из Supabase Dashboard)
3. `MOYKLASS_API_KEY` = `cUxxeiyq5CqerJpsBN9nptWxMncuTx8JFeCnudCRTA4q9G56Ia`

---

## 📁 СТРУКТУРА ПРОЕКТА

```
WU_Coach2_app/
├── index.html                          # PWA приложение (Supabase integration)
├── .github/workflows/crm-sync.yml      # GitHub Actions (каждые 15 мин)
├── migration/
│   ├── import-from-moyklass.js         # Главный скрипт импорта
│   ├── package.json                    # npm зависимости
│   ├── .env.example                    # Пример конфигурации
│   └── README.md                       # Документация
├── supabase/
│   ├── migrations/
│   │   └── 20251110000000_initial_schema.sql  # Схема БД + функция
│   ├── deploy-function.sql             # SQL для ручного деплоя
│   └── deploy-function.js              # (не используется)
└── specs/004-supabase-migration/       # Спецификации
```

---

## 🚀 КАК ЗАПУСТИТЬ ПОСЛЕ ОЧИСТКИ ЧАТА

### 1. Проверьте статус функции

```sql
-- В Supabase SQL Editor
SELECT proname FROM pg_proc WHERE proname = 'save_athlete_with_validation';
```

**Если пусто** → выполните `supabase/deploy-function.sql`

### 2. Тестовый запуск импорта

```bash
cd migration
npm install
npm run import
```

**Должно быть:**
```
✅ Supabase client initialized
🔑 Getting Moyklass access token...
✅ Token received
📥 Fetching active subscriptions...
📊 Total subscriptions: 55
✅ Season subscriptions: 55
👥 Unique users with subscriptions: 53
✅ Success: 53
❌ Errors: 0
```

### 3. Проверьте автоматическую синхронизацию

**GitHub Actions:** https://github.com/usabdnik/WU_Coach2_app/actions

**Частота:** Каждые 15 минут

**Ручной запуск:**
1. Actions → CRM Sync
2. Run workflow → main → Run workflow

---

## 🐛 TROUBLESHOOTING

### Ошибка: "Could not find function save_athlete_with_validation"

**Решение:** Выполните SQL из `supabase/deploy-function.sql` в Supabase SQL Editor

### Ошибка: "Failed to get token"

**Решение:** Проверьте `MOYKLASS_API_KEY` в секретах GitHub

### Ошибка: "Performance не синхронизируются"

**Решение:** Уже исправлено в index.html (строки 2498-2502)

### Проблема: "Показатели не отображаются"

**Решение:** Уже исправлено в transformSupabaseAthlete() (строки 1791-1842)

---

## 📞 СЛЕДУЮЩИЕ ШАГИ

1. **СРОЧНО:** Развернуть функцию `save_athlete_with_validation` в Supabase
2. Запустить GitHub Actions и проверить успешный импорт
3. Проверить данные в PWA (должны появиться 53 ученика)
4. Настроить частоту синхронизации (по умолчанию 15 мин)

---

## 📝 ЗАМЕТКИ

- **Google Sheets НЕ ИСПОЛЬЗУЕТСЯ** - данные из Moyklass API
- **Service Account НЕ НУЖЕН** - используется API ключ
- **3 секрета вместо 5** - упрощена конфигурация
- **Функция в миграции** - но не развернута (!)
- **Performance sync работает** - критический баг исправлен

---

## 🎯 ФИНАЛЬНАЯ ЗАДАЧА

**Что осталось:** Выполнить 1 SQL команду в Supabase (30 секунд)

**Файл с SQL:** `supabase/deploy-function.sql`

**Где выполнить:** https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new

**После этого:** Всё работает! 🎉

---

## 🎉 РЕЗУЛЬТАТЫ ИМПОРТА

**Выполнено:** 2025-11-11 14:52
**Метод:** Прямое подключение через psql + DB password

```bash
psql -h db.mjkssesvhowmncyctmvs.supabase.co -p 5432 -U postgres -d postgres -f deploy-function.sql
# CREATE FUNCTION ✅

node import-from-moyklass.js
# ✅ Success: 53
# ❌ Errors: 0
# 🎉 Sync completed successfully!
```

**Импортировано:**
- 53 ученика из Moyklass CRM
- Все со статусом "active"
- Все с текущим сезоном (2025-08-31 → 2026-08-30)

**GitHub Actions:** Готов к автоматической синхронизации каждые 15 минут

---

**Версия:** 2.0.0 (Moyklass Integration)
**Автор:** Claude Code + Nikita
**Статус:** ✅ 100% ЗАВЕРШЕНО - ПОЛНОСТЬЮ РАБОТАЕТ
