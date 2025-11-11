# Data Model: Schedule Management, Subscription Tracking, and Athletic Rank Recording

**Feature**: 005-schedule-rank-subscription
**Date**: 2025-11-11
**Purpose**: Define database schema extensions and data structures

---

## Overview

This feature extends the existing `athletes` table in Supabase PostgreSQL with three new nullable text columns for schedule, season start rank, and season end rank. No new tables are created (maintains simplicity per constitution).

---

## Database Schema Changes

### Extended Entity: `athletes`

**Existing Schema** (from `20251110000000_initial_schema.sql`):
```sql
CREATE TABLE public.athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    group_name TEXT,
    season TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Schema Extensions** (new migration `20251111_add_schedule_rank_fields.sql`):
```sql
ALTER TABLE public.athletes
    ADD COLUMN IF NOT EXISTS schedule TEXT NULL,
    ADD COLUMN IF NOT EXISTS rank_start TEXT NULL,
    ADD COLUMN IF NOT EXISTS rank_end TEXT NULL;

COMMENT ON COLUMN public.athletes.schedule IS
    'Athlete attendance schedule. Format: "День ЧЧ:ММ, День ЧЧ:ММ" (e.g., "Пн 18:00, Ср 19:00") for fixed schedule, or literal "Самозапись" for self-registration. NULL if not set.';

COMMENT ON COLUMN public.athletes.rank_start IS
    'Athletic rank at season start. Values: "III юношеский разряд", "II юношеский разряд", "I юношеский разряд", "III взрослый разряд", "II взрослый разряд", "I взрослый разряд", "КМС", "МС", "МСМК", "Без разряда". NULL if not set.';

COMMENT ON COLUMN public.athletes.rank_end IS
    'Athletic rank achieved by season end. Same values as rank_start. NULL if season not complete or not yet recorded.';
```

---

## Field Specifications

### `schedule` (TEXT, NULL)

**Purpose**: Stores athlete's weekly attendance schedule

**Format Options**:
1. **Fixed Schedule**: Delimited string of day-time pairs
   - Example: `"Пн 18:00, Ср 18:00, Пт 19:00"`
   - Format: `"День ЧЧ:ММ, День ЧЧ:ММ"`
   - Days: `Пн` (Mon), `Вт` (Tue), `Ср` (Wed), `Чт` (Thu), `Пт` (Fri), `Сб` (Sat), `Вс` (Sun)
   - Time: 24-hour format (HH:MM)

2. **Self-Registration**: Literal string
   - Example: `"Самозапись"`
   - No time entries (athlete registers on their own)

**Validation Rules**:
- Max length: 200 characters
- Nullable (NULL = not set, display as "(Не указано)")
- Fixed schedule regex: `^(Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2}(, (Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2})*$`
- Self-registration literal: `^Самозапись$`

**Display Format**:
- Fixed schedule: Split by comma, show as chips with 🕐 icon
- Self-registration: Show badge "Самозапись" with 📝 icon
- NULL: Show empty or "(Не указано)"

**Usage**:
- Coaches view schedule in athlete profile card and detail modal
- Coaches edit schedule via schedule edit modal (day+time picker OR self-reg toggle)
- Schedule displayed in athlete list cards (optional, space permitting)

---

### `rank_start` (TEXT, NULL)

**Purpose**: Records athlete's target athletic rank at beginning of season

**Allowed Values**:
- `"III юношеский разряд"` (3rd youth rank)
- `"II юношеский разряд"` (2nd youth rank)
- `"I юношеский разряд"` (1st youth rank)
- `"III взрослый разряд"` (3rd adult rank)
- `"II взрослый разряд"` (2nd adult rank)
- `"I взрослый разряд"` (1st adult rank)
- `"КМС"` (Candidate Master of Sport)
- `"МС"` (Master of Sport)
- `"МСМК"` (International Master of Sport)
- `"Без разряда"` (No rank - beginners)
- `NULL` (not set)

**Validation Rules**:
- Must be one of allowed values or NULL
- No free-text entry (dropdown only)
- Case-sensitive string comparison

**Display Format**:
- Show rank badge with appropriate icon: 🥉 (youth), 🥈 (adult), 🥇 (elite)
- NULL: Show "(Не указан)" or hide section

**Usage**:
- Set once per season (typically in September)
- Used for goal tracking and progress reporting
- Displayed in athlete profile summary

---

### `rank_end` (TEXT, NULL)

**Purpose**: Records athlete's achieved athletic rank by end of season

**Allowed Values**: Same as `rank_start` (see above)

**Validation Rules**:
- Must be one of allowed values or NULL
- No validation against rank_start (athlete can maintain, progress, or regress)
- Case-sensitive string comparison

**Display Format**:
- Show rank badge (same icons as rank_start)
- If both rank_start and rank_end set, show progression: `"I юношеский → III взрослый"` with ➡️ arrow
- NULL: Show "(Не присвоен)" or hide until season end

**Usage**:
- Set once per season (typically in May/June at season end)
- Used for outcome tracking and certification preparation
- Historical data preserved when new season starts (rank_start/rank_end reset for new season)

---

## Data Relationships

### No New Foreign Keys

This feature extends the existing `athletes` table only. No new tables or foreign key relationships are created.

**Rationale**:
- Schedule is athlete-specific (1:1 relationship with athlete)
- Ranks are season-specific but denormalized for simplicity (acceptable for MVP scale)
- Subscription history queried from Moyklass API (external data source, not stored in Supabase)

---

## Data Access Patterns

### Read Operations

**1. Display Athlete Profile**
```javascript
// Fetch athlete with schedule and ranks
const { data: athlete } = await supabase
  .from('athletes')
  .select('id, name, group_name, schedule, rank_start, rank_end')
  .eq('id', athleteId)
  .single();

// Transform for display
const scheduleDisplay = athlete.schedule
  ? (athlete.schedule === 'Самозапись'
      ? '<span class="badge self-reg">📝 Самозапись</span>'
      : athlete.schedule.split(', ').map(s => `<span class="chip">🕐 ${s}</span>`).join(' '))
  : '<span class="empty">(Не указано)</span>';

const rankProgress = (athlete.rank_start && athlete.rank_end)
  ? `${athlete.rank_start} ➡️ ${athlete.rank_end}`
  : athlete.rank_start || athlete.rank_end || '(Не указано)';
```

**2. Filter Athletes (List View)**
```javascript
// No special filtering for schedule/ranks (standard list query)
const { data: athletes } = await supabase
  .from('athletes')
  .select('*')
  .eq('status', 'active')
  .order('name');

// Schedule/rank data displayed in each athlete card
```

---

### Write Operations

**1. Save Schedule**
```javascript
// Fixed schedule: "Пн 18:00, Ср 19:00"
const scheduleString = scheduleEntries
  .map(entry => `${entry.day} ${entry.time}`)
  .join(', ');

await supabase
  .from('athletes')
  .update({ schedule: scheduleString })
  .eq('id', athleteId);

// Self-registration: "Самозапись"
await supabase
  .from('athletes')
  .update({ schedule: 'Самозапись' })
  .eq('id', athleteId);
```

**2. Save Ranks**
```javascript
// Save season start rank (typically at season beginning)
await supabase
  .from('athletes')
  .update({ rank_start: selectedRank })
  .eq('id', athleteId);

// Save season end rank (typically at season end)
await supabase
  .from('athletes')
  .update({ rank_end: selectedRank })
  .eq('id', athleteId);

// Save both together (if editing mid-season)
await supabase
  .from('athletes')
  .update({
    rank_start: startRank,
    rank_end: endRank
  })
  .eq('id', athleteId);
```

---

### Subscription History Query (External API)

**Not stored in Supabase** - queried from Moyklass CRM API

```javascript
// Fetch subscription history for season filtering
async function getSubscriptionHistory(seasonStart, seasonEnd) {
  const response = await fetch('https://api.moyklass.com/v1/subscriptions', {
    headers: { 'Authorization': `Bearer ${MOYKLASS_API_KEY}` }
  });

  const subscriptions = await response.json();

  // Filter by season dates
  return subscriptions.filter(sub =>
    sub.start_date <= seasonEnd && sub.end_date >= seasonStart
  );
}

// Get athlete IDs with subscription history for current season
const currentSeason = { start: '2024-09-01', end: '2025-08-31' };
const subscriptionHistory = await getSubscriptionHistory(
  currentSeason.start,
  currentSeason.end
);

const athleteIdsWithSubscription = subscriptionHistory.map(sub => sub.athlete_id);

// Filter athlete list
const athletesWithSubscription = athletes.filter(a =>
  athleteIdsWithSubscription.includes(a.id)
);
```

---

## State Management (In-Memory)

### Extended `athletesData` Array

```javascript
// Current in-memory state (localStorage + Supabase sync)
let athletesData = [
  {
    id: 'uuid',
    name: 'Иванов Иван',
    group_name: 'Начинающие',
    season: '2024-2025',
    status: 'active',
    schedule: 'Пн 18:00, Ср 18:00',        // NEW
    rank_start: 'III юношеский разряд',    // NEW
    rank_end: null,                         // NEW (season not complete)
    performance: { /* ... */ },
    records: { /* ... */ },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-11-11T12:00:00Z'
  },
  // ... more athletes
];
```

### localStorage Persistence

```javascript
// Save to localStorage (offline-first)
localStorage.setItem('athletesData', JSON.stringify(athletesData));

// Load from localStorage on app start
const cached = localStorage.getItem('athletesData');
if (cached) {
  athletesData = JSON.parse(cached);
}
```

---

## Migration Strategy

### Zero-Downtime Deployment

**Step 1**: Deploy database migration
```sql
-- Migration runs on Supabase
ALTER TABLE public.athletes
    ADD COLUMN IF NOT EXISTS schedule TEXT NULL,
    ADD COLUMN IF NOT EXISTS rank_start TEXT NULL,
    ADD COLUMN IF NOT EXISTS rank_end TEXT NULL;
```

**Step 2**: Deploy PWA with backward compatibility
- New fields are nullable (no data required)
- UI shows "(Не указано)" for NULL values
- Existing athletes continue working without data migration

**Step 3**: Coaches gradually fill data
- Coaches edit athlete profiles to add schedule/ranks as needed
- No forced data entry (progressive enhancement)

---

## Data Validation

### Client-Side (JavaScript)

```javascript
// Validate schedule format before save
function validateSchedule(scheduleString) {
  if (!scheduleString) return { valid: true }; // NULL allowed

  if (scheduleString === 'Самозапись') {
    return { valid: true };
  }

  // Fixed schedule validation
  const regex = /^(Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2}(, (Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2})*$/;
  if (!regex.test(scheduleString)) {
    return {
      valid: false,
      error: 'Неверный формат расписания. Ожидается: "Пн 18:00, Ср 19:00"'
    };
  }

  if (scheduleString.length > 200) {
    return {
      valid: false,
      error: 'Расписание слишком длинное (макс. 200 символов)'
    };
  }

  return { valid: true };
}

// Validate rank before save
function validateRank(rankString) {
  if (!rankString) return { valid: true }; // NULL allowed

  const allowedRanks = [
    'III юношеский разряд',
    'II юношеский разряд',
    'I юношеский разряд',
    'III взрослый разряд',
    'II взрослый разряд',
    'I взрослый разряд',
    'КМС',
    'МС',
    'МСМК',
    'Без разряда'
  ];

  if (!allowedRanks.includes(rankString)) {
    return {
      valid: false,
      error: 'Недопустимый разряд'
    };
  }

  return { valid: true };
}
```

### Database-Level (Optional Future Enhancement)

```sql
-- Add CHECK constraints (optional for MVP, adds safety)
ALTER TABLE public.athletes
  ADD CONSTRAINT check_schedule_format
  CHECK (
    schedule IS NULL
    OR schedule = 'Самозапись'
    OR schedule ~ '^(Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2}(, (Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2})*$'
  );

ALTER TABLE public.athletes
  ADD CONSTRAINT check_rank_values
  CHECK (
    rank_start IS NULL
    OR rank_start IN (
      'III юношеский разряд', 'II юношеский разряд', 'I юношеский разряд',
      'III взрослый разряд', 'II взрослый разряд', 'I взрослый разряд',
      'КМС', 'МС', 'МСМК', 'Без разряда'
    )
  );

ALTER TABLE public.athletes
  ADD CONSTRAINT check_rank_end_values
  CHECK (
    rank_end IS NULL
    OR rank_end IN (
      'III юношеский разряд', 'II юношеский разряд', 'I юношеский разряд',
      'III взрослый разряд', 'II взрослый разряд', 'I взрослый разряд',
      'КМС', 'МС', 'МСМК', 'Без разряда'
    )
  );
```

---

## Performance Considerations

### Query Performance

- **Index not needed**: New columns are not queried for filtering/sorting (display-only)
- **Existing indexes sufficient**: Athletes still queried by id, name, group_name, status
- **Small data volume**: 50-200 athletes, text columns <200 chars each

### Storage Impact

- **Per athlete**: ~100-200 bytes additional storage (3 text fields)
- **Total**: ~10-40 KB for 200 athletes (negligible)

---

## Summary

This data model extends the existing `athletes` table with three simple nullable text fields. No new tables, no foreign keys, no complex relationships. Design aligns with project constitution (simplicity, single-file architecture) and MVP scale requirements.

**Migration**: Zero-downtime, backward-compatible
**Validation**: Client-side primarily, optional DB constraints
**Performance**: No impact (small scale, display-only columns)
