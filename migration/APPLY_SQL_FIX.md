# Применить исправление группы вручную

## 🎯 Проблема

GitHub Actions каждые 15 минут перезаписывал все группы на 'Начинающие' из-за:
1. Скрипта `import-from-moyklass.js` передавал `group: 'Начинающие'`
2. SQL функция `save_athlete_with_validation` перезаписывала group_name даже когда получала NULL

## ✅ Что исправлено

1. ✅ **Скрипт синхронизации** (`migration/import-from-moyklass.js`):
   - Убрал строку `group: 'Начинающие'`
   - Теперь передает ТОЛЬКО `name` и `status`

2. ✅ **SQL миграция** (`supabase/migrations/20251111000001_deploy_save_athlete_function.sql`):
   - Изменено: `group_name = COALESCE(athlete_group, group_name)`
   - Теперь сохраняет существующую группу если новая не передана

## 📋 Что нужно сделать ВРУЧНУЮ

### Шаг 1: Открыть Supabase SQL Editor

🔗 https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new

### Шаг 2: Скопировать и выполнить SQL

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
  athlete_name := p_athlete_data->>'name';
  athlete_group := p_athlete_data->>'group';
  athlete_status := COALESCE(p_athlete_data->>'status', 'active');

  IF athlete_name IS NULL OR TRIM(athlete_name) = '' THEN
    RAISE EXCEPTION 'Athlete name is required';
  END IF;

  SELECT id INTO athlete_id
  FROM athletes
  WHERE name = athlete_name
  LIMIT 1;

  IF athlete_id IS NOT NULL THEN
    UPDATE athletes
    SET
      group_name = COALESCE(athlete_group, group_name),
      status = athlete_status,
      updated_at = NOW()
    WHERE id = athlete_id;
  ELSE
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

### Шаг 3: Нажать RUN

Должен появиться: `Success. No rows returned`

## ✅ Результат

После выполнения SQL:
- ✅ GitHub Actions больше НЕ будет перезаписывать группы
- ✅ Группы изменяются ТОЛЬКО вручную через приложение
- ✅ CRM синхронизация обновляет ТОЛЬКО имена и статусы

## 🔄 Для восстановления групп

Если нужно восстановить правильные группы:

```bash
node migration/import-september-october-2024.js
```

Этот скрипт установит группы из ручных данных (М-19, М-117, М-118, А-29, А-218, А-219).
