# Data Model: Аналитика по группам и показателям

**Feature**: 007-group-analytics  
**Date**: 2025-11-23

---

## Overview

This feature does NOT introduce new database tables. It leverages existing data structures (athletes, performances, exercises) and adds client-side computed entities for statistics aggregation.

**Storage Strategy**:
- **Existing tables**: `athletes`, `performances`, `exercises` in Supabase
- **Computed entities**: GroupStatistics (calculated in-memory, not persisted)
- **New field**: None required (uses existing `athletes.group` field)

---

## Core Entities

### 1. Group (Computed Entity)

**Description**: Represents a training group with aggregated statistics

**Source**: Derived from `athletesData` by grouping on `group` field

**Attributes**:
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Group identifier | "М-19" |
| `athleteCount` | number | Total athletes in group | 12 |
| `athletes` | Athlete[] | Filtered list of athletes | [...] |

**Business Rules**:
- Group names come from `AVAILABLE_GROUPS` constant: ['М-19', 'М-117', 'М-118', 'А-29', 'А-218', 'А-219']
- Special group "Без группы" for athletes with `group = null` or `group = ""`
- Groups with 0 athletes still displayed (show "0 спортсменов")

**Calculation**:
```javascript
const groups = AVAILABLE_GROUPS.map(groupName => ({
  name: groupName,
  athleteCount: athletesData.filter(a => a.group === groupName).length,
  athletes: athletesData.filter(a => a.group === groupName)
}));

// Add "No Group" category
const noGroupAthletes = athletesData.filter(a => !a.group || a.group === '');
groups.push({
  name: 'Без группы',
  athleteCount: noGroupAthletes.length,
  athletes: noGroupAthletes
});
```

---

### 2. Athlete (Existing Entity)

**Description**: Student/athlete in the gym

**Source**: `athletesData` (localStorage) / `athletes` table (Supabase)

**Relevant Attributes**:
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier (UUID or moyklass_id) |
| `name` | string | No | First name |
| `surname` | string | No | Last name |
| `group` | string | Yes | Training group (М-19, М-117, etc.) or null |
| `moyklass_id` | string | Yes | CRM system ID |

**State Transitions**:
```
No Group (null) → [User assigns] → Group (М-19)
Group (М-19) → [User changes] → Group (А-29)
Group (М-19) → [User removes] → No Group (null)
```

**Validation Rules**:
- `group` must be in `AVAILABLE_GROUPS` or null
- `group` value validated before saving
- Empty string ("") treated as null

**Related Entities**:
- `performances[]` - One-to-many relationship

---

### 3. Performance (Existing Entity)

**Description**: Record of exercise execution

**Source**: `performancesData` (localStorage) / `performances` table (Supabase)

**Relevant Attributes**:
| Field | Type | Description |
|-------|------|-------------|
| `athlete_id` | string | Foreign key to athlete |
| `exercise_name` | string | Name of exercise |
| `date` | string | ISO date (YYYY-MM-DD) |
| `value` | number | Performance value |
| `month` | string | Month identifier (YYYY-MM) |

**Filtering for Analytics**:
```javascript
// Get performances for current season
const season = getCurrentSeason(); // {start: '2024-09', end: '2025-08'}
const seasonPerformances = performancesData.filter(p =>
  p.month >= season.start && p.month <= season.end
);

// Get performances for specific group + exercise
const groupPerformances = seasonPerformances.filter(p => {
  const athlete = athletesData.find(a => a.id === p.athlete_id);
  return athlete && athlete.group === 'М-19' && p.exercise_name === 'Подтягивания';
});
```

---

### 4. Exercise (Existing Entity)

**Description**: Type of physical exercise

**Source**: `exercisesData` (localStorage) / `exercises` table (Supabase)

**Relevant Attributes**:
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Exercise name (e.g., "Подтягивания") |
| `type` | string | Category (сила/выносливость/скорость) |
| `unit` | string | Measurement unit (кг/раз/сек) |

**Usage in Analytics**:
- Dropdown selector: List all unique `exercise_name` values
- Statistics header: Show `unit` for context

---

### 5. GroupStatistics (Computed Entity)

**Description**: Aggregated statistics for a group + exercise combination

**Source**: Calculated from `performances` + `athletes` + current season

**Attributes**:
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `groupName` | string | Group identifier | "М-19" |
| `exerciseName` | string | Exercise name | "Подтягивания" |
| `athleteCount` | number | Athletes in group | 12 |
| `performanceCount` | number | Total performances recorded | 24 |
| `average` | number | Mean value | 15.5 |
| `best` | number | Maximum value | 25 |
| `worst` | number | Minimum value | 8 |
| `season` | string | Season label | "2024-2025" |

**Calculation Logic**:
```javascript
function calculateGroupStatistics(groupName, exerciseName) {
  const season = getCurrentSeason();
  
  // Step 1: Get athlete IDs in group
  const groupAthletes = athletesData.filter(a => a.group === groupName);
  const athleteIds = groupAthletes.map(a => a.id);
  
  // Step 2: Filter performances
  const performances = performancesData.filter(p =>
    athleteIds.includes(p.athlete_id) &&
    p.exercise_name === exerciseName &&
    p.month >= season.start &&
    p.month <= season.end
  );
  
  // Step 3: Aggregate
  const values = performances.map(p => p.value);
  
  return {
    groupName,
    exerciseName,
    athleteCount: groupAthletes.length,
    performanceCount: values.length,
    average: values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0,
    best: values.length ? Math.max(...values) : 0,
    worst: values.length ? Math.min(...values) : 0,
    season: `${season.start.split('-')[0]}-${season.end.split('-')[0]}`
  };
}
```

**Business Rules**:
- If no performances found: `average = 0`, `best = 0`, `worst = 0`, `performanceCount = 0`
- Values rounded to 1 decimal place for display
- Only current season data included

---

### 6. Season (Existing Logic)

**Description**: Academic year period for tracking progress

**Source**: Calculated by `getCurrentSeason()` function

**Attributes**:
| Field | Type | Description |
|-------|------|-------------|
| `start` | string | Start month (YYYY-MM) | "2024-09" |
| `end` | string | End month (YYYY-MM) | "2025-08" |
| `label` | string | Display label | "2024-2025" |

**Calculation**:
```javascript
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  
  // Season: September to August
  if (month >= 9) {
    // Sept-Dec of current year
    return {
      start: `${year}-09`,
      end: `${year + 1}-08`,
      label: `${year}-${year + 1}`
    };
  } else {
    // Jan-Aug of next year
    return {
      start: `${year - 1}-09`,
      end: `${year}-08`,
      label: `${year - 1}-${year}`
    };
  }
}
```

---

## Entity Relationships

```
┌─────────────┐
│   Season    │ (Computed - getCurrentSeason())
└─────────────┘
       │
       │ filters
       ↓
┌─────────────┐       ┌──────────────┐
│  Athlete    │──────→│ Performance  │
│             │ 1:N   │              │
│ - id        │       │ - athlete_id │
│ - name      │       │ - exercise   │
│ - group     │       │ - value      │
└─────────────┘       │ - month      │
       │              └──────────────┘
       │                     │
       │ groups by           │ references
       ↓                     ↓
┌─────────────┐       ┌──────────────┐
│   Group     │       │   Exercise   │
│ (Computed)  │       │              │
│             │       │ - name       │
└─────────────┘       │ - unit       │
       │              └──────────────┘
       │
       │ aggregates with
       ↓
┌──────────────────┐
│ GroupStatistics  │ (Computed from Performance + Athlete + Season)
│                  │
│ - average        │
│ - best/worst     │
└──────────────────┘
```

---

## Data Flow Diagrams

### Group Card Rendering

```
User opens Analytics page
        ↓
Load athletesData from localStorage
        ↓
Group athletes by `group` field
        ↓
Calculate count per group
        ↓
Include "Без группы" (null/empty groups)
        ↓
Render group cards with counts
```

### Exercise Statistics Calculation

```
User selects exercise from dropdown
        ↓
Get current season (Sept-Aug range)
        ↓
For each group:
  ├─ Filter athletes by group
  ├─ Get athlete IDs
  ├─ Filter performances:
  │  - athlete_id IN athleteIds
  │  - exercise_name = selected
  │  - month BETWEEN season.start AND season.end
  ├─ Extract values array
  └─ Calculate: avg, max, min
        ↓
Render statistics table/chart
```

### Group Assignment (No Group → Group)

```
User clicks "Без группы" card
        ↓
Open modal with list of athletes (group = null)
        ↓
User selects athlete → clicks "Назначить группу"
        ↓
Open group selector dropdown
        ↓
User selects group (М-19)
        ↓
Update athlete.group = "М-19"
        ↓
Add to pendingChanges queue
        ↓
Save to localStorage
        ↓
Close modal, refresh group cards
        ↓
[When online] Sync pendingChanges to Supabase
```

---

## Validation Rules

### Group Field Validation
```javascript
function validateGroup(groupValue) {
  const validGroups = ['М-19', 'М-117', 'М-118', 'А-29', 'А-218', 'А-219'];
  
  // null/undefined/empty string are valid (means "No Group")
  if (!groupValue || groupValue === '') return true;
  
  // Must be in valid groups list
  return validGroups.includes(groupValue);
}
```

### Statistics Calculation Edge Cases
```javascript
function safeCalculateStatistics(values) {
  // Handle empty array
  if (!values || values.length === 0) {
    return { average: 0, best: 0, worst: 0, count: 0 };
  }
  
  // Handle single value
  if (values.length === 1) {
    return { 
      average: values[0], 
      best: values[0], 
      worst: values[0], 
      count: 1 
    };
  }
  
  // Normal calculation
  return {
    average: values.reduce((sum, v) => sum + v, 0) / values.length,
    best: Math.max(...values),
    worst: Math.min(...values),
    count: values.length
  };
}
```

---

## Storage Implications

### localStorage Usage
- **No increase in storage** - no new data persisted
- GroupStatistics computed on-demand, not cached
- Existing `athletesData` used as-is

### Supabase Sync
- **Group assignments**: Sync `athletes.group` field changes
- **No new tables**: Reuse existing `athletes`, `performances`, `exercises`
- **Query pattern**: Frontend-calculated (no server-side aggregation)

---

## Performance Considerations

### Calculation Complexity
- **Group cards**: O(n) where n = athletesData.length (~50-100) → <10ms
- **Exercise statistics**: O(m) where m = performancesData.length (~1000) → <50ms
- **Total page load**: <100ms for all calculations

### Optimization Opportunities (Future)
1. **Memoization**: Cache statistics per exercise until data changes
2. **Lazy loading**: Calculate statistics only when exercise selected
3. **Pagination**: If performance data grows to >10,000 records

---

## Migration Notes

**No database migration required** - this feature uses existing schema.

**Backward compatibility**: 
- Athletes with `group = null` handled gracefully
- Old performances without `month` field excluded from statistics
- Missing exercise names display "Неизвестное упражнение"

---

**Data Model Complete** - Ready for Phase 1 Contract Design (N/A - no API endpoints) and Quickstart Guide
