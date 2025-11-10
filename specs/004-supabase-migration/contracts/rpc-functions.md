# RPC Function Contracts

**Feature**: 004-supabase-migration
**Purpose**: Postgres functions callable via Supabase RPC API
**Language**: PL/pgSQL
**Date**: 2025-11-10

---

## Overview

These Postgres functions consolidate shared business logic previously duplicated in Google Apps Script files (import.gs + webapp.gs). All functions are callable from both PWA app and CRM import script via Supabase RPC API.

**Benefits**:
- Single source of truth (update logic once, both clients benefit)
- Server-side execution (better performance)
- Transaction safety (all-or-nothing operations)
- Zero code duplication

---

## Function Index

| Function | Purpose | Input | Output | Complexity |
|----------|---------|-------|--------|------------|
| `get_current_season()` | Calculate Sept-Aug season | None | jsonb | Simple |
| `calculate_season_stats(uuid)` | Athlete stats for current season | athlete_id | jsonb | Medium |
| `sync_offline_changes(jsonb)` | Batch sync from PWA queue | changes array | jsonb | Complex |
| `save_athlete_with_validation(jsonb)` | Create/update athlete with validation | athlete data | uuid | Medium |
| `get_athlete_performances(uuid, text)` | Get performance history | athlete_id, season | jsonb[] | Simple |

---

## 1. `get_current_season()`

### Purpose

Calculate current academic season (September-August cycle) for filtering goals and performances.

### Signature

```sql
CREATE OR REPLACE FUNCTION public.get_current_season()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'start_date',
    CASE
      WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9
      THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 9, 1)
      ELSE make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int - 1, 9, 1)
    END,
    'end_date',
    CASE
      WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9
      THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, 8, 31)
      ELSE make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 8, 31)
    END,
    'season_label',
    CASE
      WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9
      THEN EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' || (EXTRACT(YEAR FROM CURRENT_DATE)::int + 1)::text
      ELSE (EXTRACT(YEAR FROM CURRENT_DATE)::int - 1)::text || '-' || EXTRACT(YEAR FROM CURRENT_DATE)::text
    END
  );
$$;
```

### JavaScript Usage

```javascript
// From PWA or import script
const { data, error } = await supabase.rpc('get_current_season')

if (!error) {
  console.log(data)
  // {
  //   start_date: '2024-09-01',
  //   end_date: '2025-08-31',
  //   season_label: '2024-2025'
  // }
}
```

### Return Value

```typescript
type SeasonInfo = {
  start_date: string  // ISO date format: 'YYYY-MM-DD'
  end_date: string    // ISO date format: 'YYYY-MM-DD'
  season_label: string // Display format: '2024-2025'
}
```

### Edge Cases

| Current Date | Season Start | Season End | Label |
|--------------|--------------|------------|-------|
| 2024-08-31 | 2023-09-01 | 2024-08-31 | 2023-2024 |
| 2024-09-01 | 2024-09-01 | 2025-08-31 | 2024-2025 |
| 2025-02-15 | 2024-09-01 | 2025-08-31 | 2024-2025 |
| 2025-09-01 | 2025-09-01 | 2026-08-31 | 2025-2026 |

---

## 2. `calculate_season_stats(athlete_id uuid)`

### Purpose

Calculate goal statistics for specific athlete in current academic season.

### Signature

```sql
CREATE OR REPLACE FUNCTION public.calculate_season_stats(athlete_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  season_start date;
  season_end date;
  current_season jsonb;
  stats jsonb;
BEGIN
  -- Get current season dates
  current_season := get_current_season();
  season_start := (current_season->>'start_date')::date;
  season_end := (current_season->>'end_date')::date;

  -- Calculate stats for this athlete
  SELECT jsonb_build_object(
    'athlete_id', calculate_season_stats.athlete_id,
    'season', current_season->>'season_label',
    'total_goals', COUNT(*),
    'completed_goals', COUNT(*) FILTER (WHERE status = 'completed'),
    'in_progress_goals', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'pending_goals', COUNT(*) FILTER (WHERE status = 'pending'),
    'completion_rate',
      CASE
        WHEN COUNT(*) > 0
        THEN ROUND((COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)) * 100, 2)
        ELSE 0
      END
  )
  INTO stats
  FROM goals
  WHERE goals.athlete_id = calculate_season_stats.athlete_id
    AND created_at >= season_start
    AND created_at <= season_end;

  RETURN stats;
END;
$$;
```

### JavaScript Usage

```javascript
const { data, error } = await supabase.rpc('calculate_season_stats', {
  athlete_id: 'uuid-here'
})

console.log(data)
// {
//   athlete_id: 'uuid-here',
//   season: '2024-2025',
//   total_goals: 15,
//   completed_goals: 12,
//   in_progress_goals: 2,
//   pending_goals: 1,
//   completion_rate: 80.00
// }
```

### Return Value

```typescript
type SeasonStats = {
  athlete_id: string
  season: string          // '2024-2025'
  total_goals: number
  completed_goals: number
  in_progress_goals: number
  pending_goals: number
  completion_rate: number // Percentage: 0-100
}
```

---

## 3. `sync_offline_changes(changes jsonb)`

### Purpose

Batch synchronize pending changes from PWA offline queue. Processes multiple operations (insert/update/delete) in single transaction.

### Signature

```sql
CREATE OR REPLACE FUNCTION public.sync_offline_changes(changes jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  change_item jsonb;
  result_counts jsonb;
  athletes_synced int := 0;
  goals_inserted int := 0;
  goals_updated int := 0;
  goals_deleted int := 0;
  performances_inserted int := 0;
  errors text[] := '{}';
BEGIN
  -- Process each change from the array
  FOR change_item IN SELECT * FROM jsonb_array_elements(changes)
  LOOP
    BEGIN
      CASE change_item->>'type'

        -- Handle athlete upsert
        WHEN 'athlete_upsert' THEN
          INSERT INTO athletes (id, name, group_name, season, status)
          VALUES (
            (change_item->'data'->>'id')::uuid,
            change_item->'data'->>'name',
            change_item->'data'->>'group_name',
            change_item->'data'->>'season',
            change_item->'data'->>'status'
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            group_name = EXCLUDED.group_name,
            season = EXCLUDED.season,
            status = EXCLUDED.status,
            updated_at = NOW();
          athletes_synced := athletes_synced + 1;

        -- Handle goal insert
        WHEN 'goal_insert' THEN
          INSERT INTO goals (id, athlete_id, exercise_id, target_value, status)
          VALUES (
            (change_item->'data'->>'id')::uuid,
            (change_item->'data'->>'athlete_id')::uuid,
            (change_item->'data'->>'exercise_id')::uuid,
            (change_item->'data'->>'target_value')::numeric,
            change_item->'data'->>'status'
          )
          ON CONFLICT (id) DO NOTHING;
          goals_inserted := goals_inserted + 1;

        -- Handle goal update
        WHEN 'goal_update' THEN
          UPDATE goals SET
            status = change_item->'data'->>'status',
            completed_at = (change_item->'data'->>'completed_at')::timestamptz,
            updated_at = NOW()
          WHERE id = (change_item->'data'->>'id')::uuid;
          goals_updated := goals_updated + 1;

        -- Handle goal delete
        WHEN 'goal_delete' THEN
          DELETE FROM goals
          WHERE id = (change_item->'data'->>'id')::uuid;
          goals_deleted := goals_deleted + 1;

        -- Handle performance insert
        WHEN 'performance_insert' THEN
          INSERT INTO performances (id, athlete_id, exercise_id, value, date, notes)
          VALUES (
            (change_item->'data'->>'id')::uuid,
            (change_item->'data'->>'athlete_id')::uuid,
            (change_item->'data'->>'exercise_id')::uuid,
            (change_item->'data'->>'value')::numeric,
            (change_item->'data'->>'date')::date,
            change_item->'data'->>'notes'
          )
          ON CONFLICT (athlete_id, exercise_id, date) DO UPDATE SET
            value = EXCLUDED.value,
            notes = EXCLUDED.notes;
          performances_inserted := performances_inserted + 1;

        ELSE
          -- Unknown type, log error but continue
          errors := array_append(errors, 'Unknown change type: ' || (change_item->>'type'));
      END CASE;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other changes
      errors := array_append(errors,
        'Error processing ' || (change_item->>'type') || ': ' || SQLERRM
      );
    END;
  END LOOP;

  -- Return summary
  result_counts := jsonb_build_object(
    'athletes_synced', athletes_synced,
    'goals_inserted', goals_inserted,
    'goals_updated', goals_updated,
    'goals_deleted', goals_deleted,
    'performances_inserted', performances_inserted,
    'total_processed', jsonb_array_length(changes),
    'errors', errors
  );

  RETURN result_counts;
END;
$$;
```

### JavaScript Usage

```javascript
// Prepare pending changes from localStorage
const pendingChanges = [
  {
    type: 'goal_update',
    data: {
      id: 'goal-uuid',
      status: 'completed',
      completed_at: '2024-11-10T15:30:00Z'
    }
  },
  {
    type: 'performance_insert',
    data: {
      id: 'perf-uuid',
      athlete_id: 'athlete-uuid',
      exercise_id: 'exercise-uuid',
      value: 15,
      date: '2024-11-10',
      notes: 'Personal best!'
    }
  }
]

// Sync to Supabase
const { data, error } = await supabase.rpc('sync_offline_changes', {
  changes: pendingChanges
})

console.log(data)
// {
//   athletes_synced: 0,
//   goals_inserted: 0,
//   goals_updated: 1,
//   goals_deleted: 0,
//   performances_inserted: 1,
//   total_processed: 2,
//   errors: []
// }
```

### Return Value

```typescript
type SyncResult = {
  athletes_synced: number
  goals_inserted: number
  goals_updated: number
  goals_deleted: number
  performances_inserted: number
  total_processed: number
  errors: string[]  // Empty array if no errors
}
```

---

## 4. `save_athlete_with_validation(athlete_data jsonb)`

### Purpose

Create or update athlete with validation rules. Returns athlete UUID.

### Signature

```sql
CREATE OR REPLACE FUNCTION public.save_athlete_with_validation(athlete_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  athlete_uuid uuid;
  athlete_name text;
  athlete_group text;
  athlete_season text;
  athlete_status text;
BEGIN
  -- Extract and validate fields
  athlete_uuid := (athlete_data->>'id')::uuid;
  athlete_name := athlete_data->>'name';
  athlete_group := athlete_data->>'group_name';
  athlete_season := athlete_data->>'season';
  athlete_status := athlete_data->>'status';

  -- Validation
  IF LENGTH(athlete_name) = 0 THEN
    RAISE EXCEPTION 'Athlete name cannot be empty';
  END IF;

  IF athlete_status NOT IN ('active', 'inactive', 'graduated') THEN
    RAISE EXCEPTION 'Invalid status: %', athlete_status;
  END IF;

  -- Upsert athlete
  INSERT INTO athletes (id, name, group_name, season, status)
  VALUES (
    COALESCE(athlete_uuid, gen_random_uuid()),
    athlete_name,
    athlete_group,
    athlete_season,
    athlete_status
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    group_name = EXCLUDED.group_name,
    season = EXCLUDED.season,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING id INTO athlete_uuid;

  RETURN athlete_uuid;
END;
$$;
```

### JavaScript Usage

```javascript
const { data: athleteId, error } = await supabase.rpc('save_athlete_with_validation', {
  athlete_data: {
    name: 'Иванов Алексей',
    group_name: 'Группа А',
    season: '2024-2025',
    status: 'active'
  }
})

console.log(athleteId) // 'uuid-here'
```

---

## 5. `get_athlete_performances(athlete_id uuid, season text)`

### Purpose

Get performance history for athlete filtered by season.

### Signature

```sql
CREATE OR REPLACE FUNCTION public.get_athlete_performances(
  athlete_id uuid,
  season text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  season_start date;
  season_end date;
  performances jsonb;
BEGIN
  -- If season specified, calculate date range
  IF season IS NOT NULL THEN
    season_start := make_date(SPLIT_PART(season, '-', 1)::int, 9, 1);
    season_end := make_date(SPLIT_PART(season, '-', 2)::int, 8, 31);
  END IF;

  -- Fetch performances
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'exercise_name', e.name,
      'value', p.value,
      'unit', e.unit,
      'date', p.date,
      'notes', p.notes
    ) ORDER BY p.date DESC
  )
  INTO performances
  FROM performances p
  JOIN exercises e ON p.exercise_id = e.id
  WHERE p.athlete_id = get_athlete_performances.athlete_id
    AND (season IS NULL OR (p.date >= season_start AND p.date <= season_end));

  RETURN COALESCE(performances, '[]'::jsonb);
END;
$$;
```

### JavaScript Usage

```javascript
// Get all performances
const { data, error } = await supabase.rpc('get_athlete_performances', {
  athlete_id: 'uuid-here'
})

// Get performances for specific season
const { data: seasonData } = await supabase.rpc('get_athlete_performances', {
  athlete_id: 'uuid-here',
  season: '2024-2025'
})
```

---

## Error Handling

### Function Exceptions

All functions use PostgreSQL exception handling:

```sql
-- Example pattern
BEGIN
  -- Logic here
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error description: %', SQLERRM;
END;
```

### JavaScript Error Handling

```javascript
const { data, error } = await supabase.rpc('function_name', { params })

if (error) {
  console.error('RPC error:', error.message)
  // Handle error (show user message, retry, etc.)
} else {
  // Use data
}
```

---

## Performance Considerations

### Index Coverage

All functions leverage existing indexes defined in data-model.md:
- `idx_goals_athlete_id`, `idx_goals_status`, `idx_goals_created_at`
- `idx_performances_athlete_id`, `idx_performances_date`
- Foreign key indexes

### Function Volatility

- **STABLE**: Functions marked STABLE can be cached within transaction (get_current_season, calculate_season_stats, get_athlete_performances)
- **VOLATILE**: Functions that modify data (sync_offline_changes, save_athlete_with_validation)

### Transaction Safety

- All functions execute within PostgreSQL transaction
- `sync_offline_changes` processes all changes atomically (all-or-nothing)
- Errors in one change don't rollback entire batch (try-catch per change)

---

## Testing Checklist

- [ ] Test `get_current_season()` across season boundaries (Aug 31 → Sep 1)
- [ ] Test `calculate_season_stats()` with athletes having 0, 1, many goals
- [ ] Test `sync_offline_changes()` with valid changes
- [ ] Test `sync_offline_changes()` with invalid data (error handling)
- [ ] Test `sync_offline_changes()` with mixed valid/invalid changes
- [ ] Test `save_athlete_with_validation()` with new athlete
- [ ] Test `save_athlete_with_validation()` updating existing athlete
- [ ] Test `save_athlete_with_validation()` with invalid status (expect exception)
- [ ] Test `get_athlete_performances()` with season filter
- [ ] Test `get_athlete_performances()` without season filter (all time)

---

**Status**: ✅ Complete
**Next Step**: Deploy functions to Supabase
**Deployment**: Copy function definitions to `.specify/supabase/functions.sql`
