# Data Model: Training Journal (Тренерский журнал)

**Feature**: 008-training-journal | **Date**: 2026-02-20

## Entities

### Existing Entities (No Schema Changes)

The journal view reads and writes existing data structures. **No new database tables or localStorage keys required.**

#### Athlete (in-memory: `athletesData[]`)

| Field | Type | Source | Usage in Journal |
|-------|------|--------|------------------|
| `id` | UUID string | Supabase | Row identifier |
| `name` | string | Supabase | Display "Фамилия Имя" |
| `lastName` | string | Derived | Sort key, display |
| `firstName` | string | Derived | Display |
| `group` | string \| null | Supabase `group_name` | Group filter |
| `performance` | Array[12] | Transformed from `performances` table | Current month values |
| `records` | Object | Transformed from `performances` table | All-time record calculation |
| `status` | string | Supabase | Filter active athletes only |

#### Performance Month Entry (`athlete.performance[index]`)

| Field | Type | Range | Usage in Journal |
|-------|------|-------|------------------|
| `month` | string | MONTHS[0..11] | Month identifier |
| `pullUps` | number | 0+ | Cell value (Подтягивания) |
| `pushUps` | number | 0+ | Cell value (Отжимания) |
| `dips` | number | 0+ | Cell value (Брусья) |

#### Records Object (`athlete.records`)

```javascript
{
    pullUps: { 'Сент': 12, 'Окт': 15, 'Фев': 18 },  // month → value
    pushUps: { 'Сент': 20, 'Нояб': 25 },
    dips: { 'Окт': 8, 'Дек': 10 }
}
```

#### All-Time Records (`allTimeRecords[athleteId]`)

```javascript
{
    pullUps: 18,  // max across all months
    pushUps: 25,
    dips: 10
}
```

---

### New View State (in-memory only, not persisted)

#### Journal State

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `journalSelectedGroups` | string[] | `[]` | Currently selected group names |
| `journalExerciseFilter` | Object | `{field: null, mode: null}` | Active exercise filter |
| `journalEditingCell` | Object \| null | `null` | Currently editing cell `{athleteId, exerciseField}` |

```javascript
// Filter modes for exercise values
journalExerciseFilter = {
    field: 'pullUps' | 'pushUps' | 'dips' | null,
    mode: 'has' | 'missing' | null  // has = value > 0, missing = value === 0
};
```

---

## Data Flow

### Read Flow (Render Journal Table)

```
athletesData (in-memory, already loaded)
  → Filter by journalSelectedGroups
    → Filter by journalExerciseFilter (current month values)
      → Sort by lastName
        → For each athlete:
          → Get performance[currentMonthIndex] for 3 exercise values
          → Get allTimeRecords[athlete.id] for 3 record values
            → Render table row
```

### Write Flow (Save Cell Value)

```
User taps cell → inline input appears
  → User enters number → Enter/blur
    → Parse integer value
      → Update athlete.performance[currentMonthIndex][exerciseField]
        → Recalculate athlete.records[exerciseField]
          → Recalculate allTimeRecords via calculateAllTimeRecords()
            → pendingChanges.push({type: 'athlete', ...})
              → saveToLocalStorage()
                → Re-render affected row
                  → Update progress counter "Принято: X/Y"
                    → updatePendingIndicator()
```

### Sync Flow (No Changes)

Existing `syncPendingChangesToSupabase()` handles `type: 'athlete'` pending changes by:
1. Deleting all performances for athlete
2. Re-inserting all monthly data as new performance records
3. This works unchanged — journal adds the same `type: 'athlete'` format

---

## Constants

```javascript
// Existing (reused)
const MONTHS = ['Сент', 'Окт', 'Нояб', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг'];
const AVAILABLE_GROUPS = ['М-19', 'М-117', 'М-118', 'А-29', 'А-218', 'А-219'];

// New
const JOURNAL_EXERCISES = [
    { field: 'pullUps', label: 'Подт', fullLabel: 'Подтягивания' },
    { field: 'pushUps', label: 'Отж', fullLabel: 'Отжимания' },
    { field: 'dips', label: 'Бр', fullLabel: 'Брусья' }
];
```

---

## Validation Rules

| Rule | Condition | Action |
|------|-----------|--------|
| Numeric only | Input must be integer ≥ 0 | `<input type="number" min="0" inputmode="numeric">` |
| Zero allowed | Value = 0 is valid (clears the record) | Display as "0", not "—" |
| Negative rejected | Value < 0 | Prevent via `min="0"` attribute |
| Non-numeric rejected | Non-integer input | HTML5 number input + `parseInt()` fallback |
| Empty = no change | User opens input and leaves empty | Revert to previous value |
| Group required | Athletes without group excluded | Filter: `athlete.group != null` |

---

## Relationships

```
┌─────────────────┐     ┌──────────────────────┐
│   athletesData   │     │  allTimeRecords       │
│ (global array)   │────▶│ (global object)       │
│                  │     │ Keyed by athlete.id   │
│ .performance[12] │     │ {pullUps, pushUps,    │
│ .records{}       │     │  dips} = max values   │
│ .group           │     └──────────────────────┘
└─────────────────┘
        │
        │ filtered by
        ▼
┌─────────────────┐     ┌──────────────────────┐
│ Journal View     │     │  AVAILABLE_GROUPS     │
│ State            │────▶│ (constant array)      │
│                  │     │ Group chip source     │
│ selectedGroups[] │     └──────────────────────┘
│ exerciseFilter{} │
│ editingCell{}    │
└─────────────────┘
```
