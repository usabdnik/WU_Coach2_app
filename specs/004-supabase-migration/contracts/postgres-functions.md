# Postgres Functions (RPC)

**Feature**: Supabase Migration
**Purpose**: Define shared business logic callable by PWA and migration scripts

## Overview

Postgres functions consolidate duplicate code from Google Apps Script files (import.gs + webapp.gs) into single-source database functions. This eliminates code duplication and ensures consistent logic across all clients.

---

## Function Specifications

### 1. get_current_season()

**Purpose**: Calculate current academic season (September-August cycle) per constitution requirement

**Signature**:
```sql
CREATE OR REPLACE FUNCTION get_current_season()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  season_start_year INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Season runs from September to August
  -- If current month is Sept-Dec, season started this year
  -- If current month is Jan-Aug, season started last year
  IF current_month >= 9 THEN
    season_start_year := current_year;
  ELSE
    season_start_year := current_year - 1;
  END IF;
  
  -- Return format: "2024/2025"
  RETURN season_start_year || '/' || (season_start_year + 1);
END;
$$;
```

**Returns**: String in format "YYYY/YYYY" (e.g., "2024/2025")

**Test Cases**:
- `2024-09-01` → "2024/2025" (September starts new season)
- `2024-12-25` → "2024/2025" (December in same season)
- `2025-03-15` → "2024/2025" (March still in 2024 season)
- `2025-06-30` → "2024/2025" (June still in 2024 season)
- `2025-08-31` → "2024/2025" (August is last month of season)
- `2025-09-01` → "2025/2026" (September starts next season)

**Usage**:
```javascript
// PWA app
const { data, error } = await supabase.rpc('get_current_season');
console.log(data); // "2024/2025"
```

---

### 2. calculate_season_stats(p_athlete_id UUID)

**Purpose**: Calculate athlete performance statistics for current season

**Signature**:
```sql
CREATE OR REPLACE FUNCTION calculate_season_stats(p_athlete_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  current_season TEXT;
  stats JSON;
BEGIN
  current_season := get_current_season();
  
  SELECT json_build_object(
    'season', current_season,
    'total_goals', COUNT(*),
    'completed_goals', COUNT(*) FILTER (WHERE status = 'completed'),
    'in_progress_goals', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'completion_rate', 
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 1)
        ELSE 0
      END
  ) INTO stats
  FROM goals
  WHERE athlete_id = p_athlete_id
    AND season = current_season;
  
  RETURN stats;
END;
$$;
```

**Returns**: JSON object with season statistics
```json
{
  "season": "2024/2025",
  "total_goals": 12,
  "completed_goals": 8,
  "in_progress_goals": 4,
  "completion_rate": 66.7
}
```

**Usage**:
```javascript
// PWA app
const { data, error } = await supabase.rpc('calculate_season_stats', {
  p_athlete_id: 'uuid-here'
});
```

---

### 3. save_athlete_with_validation(p_athlete_data JSON)

**Purpose**: Save or update athlete with data validation

**Signature**:
```sql
CREATE OR REPLACE FUNCTION save_athlete_with_validation(p_athlete_data JSON)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  athlete_id UUID;
  athlete_name TEXT;
  athlete_group TEXT;
BEGIN
  -- Extract and validate required fields
  athlete_name := p_athlete_data->>'name';
  athlete_group := p_athlete_data->>'group';
  
  IF athlete_name IS NULL OR TRIM(athlete_name) = '' THEN
    RAISE EXCEPTION 'Athlete name is required';
  END IF;
  
  IF athlete_group IS NULL OR athlete_group NOT IN ('Начинающие', 'Средняя', 'Старшая', 'Спортсмены') THEN
    RAISE EXCEPTION 'Invalid athlete group: %', athlete_group;
  END IF;
  
  -- Insert or update
  INSERT INTO athletes (
    id,
    name,
    "group",
    season,
    status,
    created_at,
    updated_at
  ) VALUES (
    COALESCE((p_athlete_data->>'id')::UUID, gen_random_uuid()),
    athlete_name,
    athlete_group,
    get_current_season(),
    COALESCE(p_athlete_data->>'status', 'active'),
    COALESCE((p_athlete_data->>'created_at')::TIMESTAMP, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "group" = EXCLUDED."group",
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING id INTO athlete_id;
  
  RETURN athlete_id;
END;
$$;
```

**Parameters**: JSON object with athlete data
```json
{
  "id": "uuid-or-null",
  "name": "Иван Иванов",
  "group": "Средняя",
  "status": "active"
}
```

**Returns**: UUID of saved athlete

**Validation Rules**:
- Name must not be empty
- Group must be one of: Начинающие, Средняя, Старшая, Спортсмены
- Raises exception on validation failure

**Usage**:
```javascript
// PWA app or CRM import script
const { data, error } = await supabase.rpc('save_athlete_with_validation', {
  p_athlete_data: {
    name: 'Иван Иванов',
    group: 'Средняя',
    status: 'active'
  }
});
```

---

### 4. sync_offline_changes(p_changes JSON)

**Purpose**: Process batch of offline changes from PWA pendingChanges queue

**Signature**:
```sql
CREATE OR REPLACE FUNCTION sync_offline_changes(p_changes JSON)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  change JSON;
  result JSON;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
  errors JSON[] := ARRAY[]::JSON[];
BEGIN
  -- Process each change in the array
  FOR change IN SELECT * FROM json_array_elements(p_changes)
  LOOP
    BEGIN
      -- Handle different change types
      CASE change->>'type'
        WHEN 'goal_update' THEN
          UPDATE goals
          SET 
            status = change->'data'->>'status',
            current_value = (change->'data'->>'current_value')::INTEGER,
            updated_at = NOW()
          WHERE id = (change->>'id')::UUID;
          
        WHEN 'goal_create' THEN
          INSERT INTO goals (
            id, athlete_id, exercise_id, target_value, 
            current_value, status, season, created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            (change->'data'->>'athlete_id')::UUID,
            (change->'data'->>'exercise_id')::UUID,
            (change->'data'->>'target_value')::INTEGER,
            COALESCE((change->'data'->>'current_value')::INTEGER, 0),
            COALESCE(change->'data'->>'status', 'in_progress'),
            get_current_season(),
            NOW(),
            NOW()
          );
          
        WHEN 'goal_delete' THEN
          DELETE FROM goals WHERE id = (change->>'id')::UUID;
          
        ELSE
          RAISE EXCEPTION 'Unknown change type: %', change->>'type';
      END CASE;
      
      success_count := success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      errors := array_append(errors, json_build_object(
        'change', change,
        'error', SQLERRM
      ));
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success_count', success_count,
    'error_count', error_count,
    'errors', to_json(errors)
  );
END;
$$;
```

**Parameters**: JSON array of changes
```json
[
  {
    "type": "goal_update",
    "id": "uuid",
    "data": { "status": "completed", "current_value": 25 }
  },
  {
    "type": "goal_create",
    "data": {
      "athlete_id": "uuid",
      "exercise_id": "uuid",
      "target_value": 30,
      "current_value": 0
    }
  }
]
```

**Returns**: Sync result summary
```json
{
  "success_count": 5,
  "error_count": 1,
  "errors": [
    {
      "change": {...},
      "error": "Foreign key violation"
    }
  ]
}
```

**Supported Change Types**:
- `goal_update`: Update existing goal status/value
- `goal_create`: Create new goal
- `goal_delete`: Delete goal

**Usage**:
```javascript
// PWA app sync function
const { data, error } = await supabase.rpc('sync_offline_changes', {
  p_changes: pendingChanges
});

if (data.error_count === 0) {
  // All synced successfully, clear pendingChanges
  pendingChanges = [];
} else {
  // Show errors to user
  console.error(data.errors);
}
```

---

### 5. get_athlete_performances(p_athlete_id UUID, p_exercise_id UUID DEFAULT NULL)

**Purpose**: Retrieve performance history for athlete (optionally filtered by exercise)

**Signature**:
```sql
CREATE OR REPLACE FUNCTION get_athlete_performances(
  p_athlete_id UUID,
  p_exercise_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  exercise_name TEXT,
  value INTEGER,
  date DATE,
  season TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    e.name AS exercise_name,
    p.value,
    p.date,
    p.season
  FROM performances p
  JOIN exercises e ON p.exercise_id = e.id
  WHERE p.athlete_id = p_athlete_id
    AND (p_exercise_id IS NULL OR p.exercise_id = p_exercise_id)
  ORDER BY p.date DESC;
END;
$$;
```

**Parameters**:
- `p_athlete_id` (required): Athlete UUID
- `p_exercise_id` (optional): Filter by specific exercise

**Returns**: Table of performance records

**Usage**:
```javascript
// Get all performances for athlete
const { data, error } = await supabase.rpc('get_athlete_performances', {
  p_athlete_id: 'uuid'
});

// Get specific exercise performances
const { data, error } = await supabase.rpc('get_athlete_performances', {
  p_athlete_id: 'uuid',
  p_exercise_id: 'exercise-uuid'
});
```

---

## Deployment

Functions are deployed via:
1. `.specify/supabase/functions.sql` - SQL file with all function definitions
2. Task T009: Deploy via Supabase SQL Editor
3. Task T012: Verify functions exist with `SELECT * FROM pg_proc WHERE proname IN (...)`

---

## Testing Strategy

**Unit Testing Checklist**:
- [ ] `get_current_season()`: Test all 6 test cases for month boundaries
- [ ] `calculate_season_stats()`: Test with 0 goals, mixed statuses, all completed
- [ ] `save_athlete_with_validation()`: Test insert, update, validation errors
- [ ] `sync_offline_changes()`: Test all change types, error handling
- [ ] `get_athlete_performances()`: Test with/without exercise filter

**Integration Testing**:
- [ ] PWA calls all functions successfully
- [ ] CRM import script uses save_athlete_with_validation()
- [ ] Error messages are user-friendly in Russian

---

**Version**: 1.0.0
**Created**: 2025-11-10
**Author**: Analysis remediation (C2 resolution)
