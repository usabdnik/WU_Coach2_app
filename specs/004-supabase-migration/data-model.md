# Data Model: WU Coach 2 PostgreSQL Schema

**Feature**: 004-supabase-migration
**Database**: Supabase PostgreSQL 15+
**Schema**: `public`
**Date**: 2025-11-10

---

## Overview

This data model defines the PostgreSQL schema for WU Coach 2 PWA, migrated from Google Sheets. Designed for single-coach usage with 50-200 athletes, 20-50 exercises, 100-500 goals per academic season (September-August).

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Athletes   │────┐    │  Exercises   │    ┌────│    Goals    │
│             │    │    │              │    │    │             │
│ id (PK)     │    │    │ id (PK)      │    │    │ id (PK)     │
│ name        │    │    │ name         │    │    │ athlete_id  │
│ group       │    │    │ type         │    │    │ exercise_id │
│ season      │    │    │ category     │    │    │ target_value│
│ status      │    │    │ unit         │    │    │ status      │
└─────────────┘    │    └──────────────┘    │    └─────────────┘
       │           │           │             │           │
       │           │           │             │           │
       │           └───────────┼─────────────┘           │
       │                       │                         │
       │                       │                         │
       └───────────────────────┼─────────────────────────┘
                               │
                               ↓
                       ┌──────────────┐
                       │ Performances │
                       │              │
                       │ id (PK)      │
                       │ athlete_id   │
                       │ exercise_id  │
                       │ value        │
                       │ date         │
                       └──────────────┘
```

---

## Table Definitions

### 1. `athletes` Table

**Purpose**: Student records with group assignment and seasonal status

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique athlete identifier |
| `name` | text | NOT NULL | Full name (Russian) |
| `group_name` | text | NOT NULL | Training group (e.g., "Группа А", "10 класс") |
| `season` | text | NOT NULL | Academic year (e.g., "2024-2025") |
| `status` | text | NOT NULL, DEFAULT 'active' | Status: active, inactive, graduated |
| `created_at` | timestamptz | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | timestamptz | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
```sql
CREATE INDEX idx_athletes_status ON athletes(status);
CREATE INDEX idx_athletes_season ON athletes(season);
CREATE INDEX idx_athletes_group ON athletes(group_name);
```

**Validation Rules**:
- `status` must be one of: 'active', 'inactive', 'graduated'
- `name` must not be empty (length > 0)
- `season` format: "YYYY-YYYY" (e.g., "2024-2025")

**Sample Data**:
```sql
INSERT INTO athletes (name, group_name, season, status) VALUES
  ('Иванов Алексей', 'Группа А', '2024-2025', 'active'),
  ('Петрова Мария', '10 класс', '2024-2025', 'active');
```

---

### 2. `exercises` Table

**Purpose**: Exercise definitions with categorization and measurement units

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique exercise identifier |
| `name` | text | NOT NULL, UNIQUE | Exercise name (Russian) |
| `type` | text | NOT NULL | Type: strength, cardio, flexibility, skill |
| `category` | text | NOT NULL | Category: upper-body, lower-body, core, full-body |
| `unit` | text | NOT NULL | Measurement unit: reps, kg, seconds, meters |
| `created_at` | timestamptz | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | timestamptz | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
```sql
CREATE INDEX idx_exercises_type ON exercises(type);
CREATE INDEX idx_exercises_category ON exercises(category);
```

**Validation Rules**:
- `type` must be one of: 'strength', 'cardio', 'flexibility', 'skill'
- `category` must be one of: 'upper-body', 'lower-body', 'core', 'full-body'
- `unit` must be one of: 'reps', 'kg', 'seconds', 'meters'
- `name` must be unique (no duplicate exercises)

**Sample Data**:
```sql
INSERT INTO exercises (name, type, category, unit) VALUES
  ('Подтягивания', 'strength', 'upper-body', 'reps'),
  ('Приседания', 'strength', 'lower-body', 'reps'),
  ('Бег 100м', 'cardio', 'full-body', 'seconds');
```

---

### 3. `goals` Table

**Purpose**: Target performance values for athlete-exercise combinations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique goal identifier |
| `athlete_id` | uuid | NOT NULL, REFERENCES athletes(id) ON DELETE CASCADE | Athlete foreign key |
| `exercise_id` | uuid | NOT NULL, REFERENCES exercises(id) ON DELETE CASCADE | Exercise foreign key |
| `target_value` | numeric(10,2) | NOT NULL | Target performance value |
| `status` | text | NOT NULL, DEFAULT 'pending' | Status: pending, in_progress, completed, cancelled |
| `completed_at` | timestamptz | NULL | Completion timestamp (NULL if not completed) |
| `created_at` | timestamptz | NOT NULL, DEFAULT NOW() | Goal creation timestamp |
| `updated_at` | timestamptz | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
```sql
CREATE INDEX idx_goals_athlete_id ON goals(athlete_id);
CREATE INDEX idx_goals_exercise_id ON goals(exercise_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_created_at ON goals(created_at);
CREATE INDEX idx_goals_athlete_status ON goals(athlete_id, status); -- Composite for common query
```

**Validation Rules**:
- `status` must be one of: 'pending', 'in_progress', 'completed', 'cancelled'
- `target_value` must be > 0
- `completed_at` must be NULL if status != 'completed'
- `completed_at` must be NOT NULL if status = 'completed'
- Unique constraint: One goal per athlete+exercise combination per season

**Sample Data**:
```sql
INSERT INTO goals (athlete_id, exercise_id, target_value, status) VALUES
  ('uuid-athlete-1', 'uuid-exercise-pullups', 15, 'in_progress'),
  ('uuid-athlete-2', 'uuid-exercise-squats', 50, 'completed');
```

---

### 4. `performances` Table

**Purpose**: Historical performance records with date tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique performance identifier |
| `athlete_id` | uuid | NOT NULL, REFERENCES athletes(id) ON DELETE CASCADE | Athlete foreign key |
| `exercise_id` | uuid | NOT NULL, REFERENCES exercises(id) ON DELETE CASCADE | Exercise foreign key |
| `value` | numeric(10,2) | NOT NULL | Performance value (in exercise unit) |
| `date` | date | NOT NULL, DEFAULT CURRENT_DATE | Performance date |
| `notes` | text | NULL | Optional notes (injuries, conditions, etc.) |
| `created_at` | timestamptz | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Indexes**:
```sql
CREATE INDEX idx_performances_athlete_id ON performances(athlete_id);
CREATE INDEX idx_performances_exercise_id ON performances(exercise_id);
CREATE INDEX idx_performances_date ON performances(date);
CREATE INDEX idx_performances_athlete_date ON performances(athlete_id, date DESC); -- For timeline queries
```

**Validation Rules**:
- `value` must be > 0
- `date` must be <= CURRENT_DATE (no future performances)
- Unique constraint: One performance per athlete+exercise+date

**Sample Data**:
```sql
INSERT INTO performances (athlete_id, exercise_id, value, date, notes) VALUES
  ('uuid-athlete-1', 'uuid-exercise-pullups', 12, '2024-11-01', 'First attempt'),
  ('uuid-athlete-1', 'uuid-exercise-pullups', 14, '2024-11-10', 'Improving!');
```

---

## Relationships

### Foreign Keys

```sql
-- Goals → Athletes
ALTER TABLE goals
  ADD CONSTRAINT fk_goals_athlete
  FOREIGN KEY (athlete_id)
  REFERENCES athletes(id)
  ON DELETE CASCADE;

-- Goals → Exercises
ALTER TABLE goals
  ADD CONSTRAINT fk_goals_exercise
  FOREIGN KEY (exercise_id)
  REFERENCES exercises(id)
  ON DELETE CASCADE;

-- Performances → Athletes
ALTER TABLE performances
  ADD CONSTRAINT fk_performances_athlete
  FOREIGN KEY (athlete_id)
  REFERENCES athletes(id)
  ON DELETE CASCADE;

-- Performances → Exercises
ALTER TABLE performances
  ADD CONSTRAINT fk_performances_exercise
  FOREIGN KEY (exercise_id)
  REFERENCES exercises(id)
  ON DELETE CASCADE;
```

**Cascade Rules**:
- Delete athlete → Delete all their goals and performances
- Delete exercise → Delete all related goals and performances
- **Rationale**: Athletes and exercises are core entities; goals/performances are dependent

---

## Constraints & Validation

### Check Constraints

```sql
-- Athletes
ALTER TABLE athletes
  ADD CONSTRAINT chk_athletes_status
  CHECK (status IN ('active', 'inactive', 'graduated'));

ALTER TABLE athletes
  ADD CONSTRAINT chk_athletes_name_not_empty
  CHECK (LENGTH(name) > 0);

-- Exercises
ALTER TABLE exercises
  ADD CONSTRAINT chk_exercises_type
  CHECK (type IN ('strength', 'cardio', 'flexibility', 'skill'));

ALTER TABLE exercises
  ADD CONSTRAINT chk_exercises_category
  CHECK (category IN ('upper-body', 'lower-body', 'core', 'full-body'));

ALTER TABLE exercises
  ADD CONSTRAINT chk_exercises_unit
  CHECK (unit IN ('reps', 'kg', 'seconds', 'meters'));

-- Goals
ALTER TABLE goals
  ADD CONSTRAINT chk_goals_status
  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE goals
  ADD CONSTRAINT chk_goals_target_positive
  CHECK (target_value > 0);

ALTER TABLE goals
  ADD CONSTRAINT chk_goals_completed_at_consistency
  CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  );

-- Performances
ALTER TABLE performances
  ADD CONSTRAINT chk_performances_value_positive
  CHECK (value > 0);

ALTER TABLE performances
  ADD CONSTRAINT chk_performances_date_not_future
  CHECK (date <= CURRENT_DATE);
```

### Unique Constraints

```sql
-- Exercises: Unique names
ALTER TABLE exercises
  ADD CONSTRAINT uq_exercises_name
  UNIQUE (name);

-- Goals: One goal per athlete+exercise per season
-- (Season derived from created_at timestamp)
CREATE UNIQUE INDEX uq_goals_athlete_exercise_season
  ON goals (athlete_id, exercise_id, EXTRACT(YEAR FROM created_at));

-- Performances: One performance per athlete+exercise+date
ALTER TABLE performances
  ADD CONSTRAINT uq_performances_athlete_exercise_date
  UNIQUE (athlete_id, exercise_id, date);
```

---

## Triggers

### Auto-Update `updated_at` Timestamp

```sql
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_athletes_updated_at
  BEFORE UPDATE ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
```

---

## Migrations from Google Sheets

### Data Mapping

| Google Sheets Column | PostgreSQL Table | Column | Transformation |
|---------------------|------------------|--------|----------------|
| Athlete Name | athletes | name | Direct copy |
| Group | athletes | group_name | Direct copy |
| Status | athletes | status | Lowercase + validation |
| Exercise Name | exercises | name | Direct copy |
| Exercise Type | exercises | type | Lowercase + validation |
| Goal Target | goals | target_value | Parse as numeric |
| Goal Status | goals | status | Lowercase + validation |
| Performance Value | performances | value | Parse as numeric |
| Performance Date | performances | date | Parse as ISO date |

### Migration Script Pseudocode

```javascript
// 1. Create athletes (with UUID generation)
const athletesMap = {}
for (const row of sheetsAthletes) {
  const uuid = crypto.randomUUID()
  athletesMap[row.name] = uuid
  await supabase.from('athletes').insert({
    id: uuid,
    name: row.name,
    group_name: row.group,
    season: '2024-2025',
    status: row.status.toLowerCase()
  })
}

// 2. Create exercises (with UUID generation)
const exercisesMap = {}
for (const row of sheetsExercises) {
  const uuid = crypto.randomUUID()
  exercisesMap[row.name] = uuid
  await supabase.from('exercises').insert({
    id: uuid,
    name: row.name,
    type: row.type.toLowerCase(),
    category: row.category.toLowerCase(),
    unit: row.unit.toLowerCase()
  })
}

// 3. Create goals (using UUIDs from maps)
for (const row of sheetsGoals) {
  await supabase.from('goals').insert({
    athlete_id: athletesMap[row.athlete_name],
    exercise_id: exercisesMap[row.exercise_name],
    target_value: parseFloat(row.target),
    status: row.status.toLowerCase()
  })
}

// 4. Create performances (using UUIDs from maps)
for (const row of sheetsPerformances) {
  await supabase.from('performances').insert({
    athlete_id: athletesMap[row.athlete_name],
    exercise_id: exercisesMap[row.exercise_name],
    value: parseFloat(row.value),
    date: new Date(row.date).toISOString().split('T')[0]
  })
}
```

---

## Query Patterns

### Common Queries

**Get all active athletes with goal count**:
```sql
SELECT
  a.id,
  a.name,
  a.group_name,
  COUNT(g.id) AS total_goals,
  COUNT(g.id) FILTER (WHERE g.status = 'completed') AS completed_goals
FROM athletes a
LEFT JOIN goals g ON a.id = g.athlete_id
WHERE a.status = 'active'
GROUP BY a.id, a.name, a.group_name
ORDER BY a.name;
```

**Get athlete performance history for specific exercise**:
```sql
SELECT
  p.date,
  p.value,
  e.unit,
  p.notes
FROM performances p
JOIN exercises e ON p.exercise_id = e.id
WHERE p.athlete_id = $1
  AND p.exercise_id = $2
ORDER BY p.date DESC;
```

**Get current season goals for athlete**:
```sql
SELECT
  g.id,
  e.name AS exercise_name,
  g.target_value,
  e.unit,
  g.status,
  g.completed_at
FROM goals g
JOIN exercises e ON g.exercise_id = e.id
WHERE g.athlete_id = $1
  AND g.created_at >= (SELECT (get_current_season()->>'start_date')::date)
  AND g.created_at <= (SELECT (get_current_season()->>'end_date')::date)
ORDER BY g.created_at DESC;
```

---

## Performance Optimization

### Estimated Query Performance (200 athletes, 500 goals)

| Query | Without Indexes | With Indexes | Improvement |
|-------|----------------|--------------|-------------|
| List all active athletes | ~50ms | ~10ms | 5x faster |
| Get athlete goals | ~100ms | ~15ms | 6x faster |
| Search by name | ~200ms | ~20ms | 10x faster |
| Performance history | ~150ms | ~25ms | 6x faster |

### Index Coverage Analysis

```sql
-- Check index usage (run after deployment)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## Security Considerations

### Row Level Security (RLS)

**Policies applied**: See `contracts/rls-policies.md`

**Summary**:
- All tables have RLS enabled
- Authenticated users have full access (single coach use case)
- No row-level filtering (all data visible to authenticated session)

### Data Privacy

**Current State (MVP)**:
- No PII encryption (names stored in plaintext)
- No audit trail (no tracking of who changed what)
- Acceptable for internal coaching tool with trusted access

**Future Hardening** (if needed):
- Add `coach_id` column for multi-coach support
- Add audit log table for change tracking
- Consider encrypting athlete names (PII)

---

## Backup & Recovery

### Supabase Automatic Backups

**Free Tier**: Daily backups, 7-day retention
**Pro Tier**: Point-in-time recovery (PITR)

### Manual Backup Strategy

```bash
# Export full database to SQL
pg_dump -h db.YOUR_PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  -f backup-$(date +%Y%m%d).sql

# Restore from backup
psql -h db.YOUR_PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  -f backup-20241110.sql
```

---

## Next Steps

1. ✅ Data model defined
2. ⏳ Generate `schema.sql` from this model (Phase 1)
3. ⏳ Generate RLS policies (Phase 1 - see contracts/)
4. ⏳ Generate Postgres functions (Phase 1 - see contracts/)
5. ⏳ Deploy schema to Supabase
6. ⏳ Execute migration scripts
7. ⏳ Verify data integrity

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-11-10
**Ready for**: SQL schema generation and deployment
