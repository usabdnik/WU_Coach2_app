# Data Model: Goal Editing & Dynamic Athlete Sync

**Feature**: 001-goal-editing-athlete-sync
**Date**: 2025-11-03
**Purpose**: Define entity schemas, relationships, validation rules, and state transitions

---

## Entity Overview

```
┌─────────────┐
│  Athlete    │
│  (Enhanced) │
└──────┬──────┘
       │ 1
       │
       │ has many
       │
       │ N
┌──────┴──────┐
│    Goal     │
│  (Enhanced) │
└─────────────┘
```

---

## Entity 1: Goal (Enhanced)

### Purpose
Represents a performance goal set by coach for a specific athlete with full editing capabilities.

### Schema

```javascript
{
  // Identity
  "id": "550e8400-e29b-41d4-a716-446655440000", // string, UUID v4, IMMUTABLE after creation

  // Relationships
  "athleteId": "7c9e6679-7425-40de-944b-e07fc1f90ae7", // string, UUID v4, references Athlete.id
  "athleteName": "Иванов Иван", // string, denormalized for display performance

  // Goal Definition (ALL EDITABLE)
  "exerciseType": "pull-ups", // string, enum: "pull-ups" | "push-ups" | "dips"
  "targetValue": 10, // number, positive integer, target performance count
  "startDate": "2025-11-01", // string, ISO date (YYYY-MM-DD), EDITABLE
  "endDate": "2025-11-30", // string, ISO date (YYYY-MM-DD), EDITABLE, MUST be after startDate
  "description": "10 подтягиваний к концу месяца", // string, max 200 chars, EDITABLE

  // Status Tracking
  "status": "active", // string, enum: "active" | "completed" | "expired"

  // Timestamps
  "createdAt": "2025-11-01T10:00:00.000Z", // string, ISO 8601, IMMUTABLE (original creation)
  "updatedAt": "2025-11-03T14:30:00.000Z", // string, ISO 8601, updates on every edit
  "completedAt": null // string | null, ISO 8601, set when status → completed
}
```

### Field Specifications

| Field | Type | Required | Editable | Validation | Default |
|-------|------|----------|----------|------------|---------|
| `id` | string (UUID) | Yes | No (immutable) | UUID v4 format | `generateUUID()` |
| `athleteId` | string (UUID) | Yes | No (immutable) | Must reference existing Athlete.id | - |
| `athleteName` | string | Yes | No (auto-update) | Non-empty | From Athlete.name |
| `exerciseType` | string (enum) | Yes | Yes | One of: pull-ups, push-ups, dips | - |
| `targetValue` | number (int) | Yes | Yes | Positive integer (>0) | - |
| `startDate` | string (ISO date) | Yes | Yes | Valid date, YYYY-MM-DD format | - |
| `endDate` | string (ISO date) | Yes | Yes | Valid date, after startDate | - |
| `description` | string | Yes | Yes | Max 200 characters, non-empty | - |
| `status` | string (enum) | Yes | Yes (via action) | One of: active, completed, expired | "active" |
| `createdAt` | string (ISO 8601) | Yes | No (immutable) | Valid ISO timestamp | `new Date().toISOString()` |
| `updatedAt` | string (ISO 8601) | Yes | Yes (auto-update) | Valid ISO timestamp | `new Date().toISOString()` |
| `completedAt` | string \| null | No | Yes (via action) | Valid ISO timestamp or null | null |

### Validation Rules

**Date Validation**:
```javascript
function validateGoalDates(startDate, endDate) {
  // Parse ISO date strings
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check validity
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      valid: false,
      error: 'Некорректная дата'
    };
  }

  // Check temporal order
  if (end <= start) {
    return {
      valid: false,
      error: 'Дата окончания должна быть после даты начала'
    };
  }

  return { valid: true };
}
```

**Description Validation**:
```javascript
function validateDescription(description) {
  if (!description || description.trim().length === 0) {
    return {
      valid: false,
      error: 'Описание не может быть пустым'
    };
  }

  if (description.length > 200) {
    return {
      valid: false,
      error: 'Описание не может превышать 200 символов'
    };
  }

  return { valid: true };
}
```

**Target Value Validation**:
```javascript
function validateTargetValue(targetValue) {
  if (typeof targetValue !== 'number' || targetValue <= 0 || !Number.isInteger(targetValue)) {
    return {
      valid: false,
      error: 'Целевое значение должно быть положительным целым числом'
    };
  }

  return { valid: true };
}
```

**Full Goal Validation** (before save):
```javascript
function validateGoal(goal) {
  const errors = [];

  // Validate dates
  const dateValidation = validateGoalDates(goal.startDate, goal.endDate);
  if (!dateValidation.valid) errors.push(dateValidation.error);

  // Validate description
  const descValidation = validateDescription(goal.description);
  if (!descValidation.valid) errors.push(descValidation.error);

  // Validate target value
  const targetValidation = validateTargetValue(goal.targetValue);
  if (!targetValidation.valid) errors.push(targetValidation.error);

  // Validate exercise type
  const validExercises = ['pull-ups', 'push-ups', 'dips'];
  if (!validExercises.includes(goal.exerciseType)) {
    errors.push('Некорректный тип упражнения');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### State Transitions

```
[Create] ──────────────────────────────────────> active
                                                   │
                                                   │ [Mark Complete]
                                                   ↓
                                                completed
                                                   │
                                                   │ [Can still edit]
                                                   ↓
                                                completed
                                                (fields updated)

[Auto-expire] ──> expired (if endDate < today && status === active)
```

**State Rules**:
- **active**: Goal is ongoing, can be edited
- **completed**: Goal marked complete, can still be edited (retroactive changes allowed)
- **expired**: Goal past endDate but not completed (auto-determined, not stored in DB)

**State Determination Logic**:
```javascript
function determineGoalStatus(goal) {
  if (goal.status === 'completed') return 'completed';

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const endDate = new Date(goal.endDate);
  endDate.setHours(0, 0, 0, 0);

  if (endDate < today) return 'expired';
  return 'active';
}
```

### Indexes

**Primary Index**:
- `id` (unique, for lookups by goal ID)

**Secondary Indexes** (for filtering/queries):
- `athleteId` (find all goals for athlete)
- `status` (find active/completed goals)
- `exerciseType` (find goals by exercise type)

### localStorage Storage

**Key**: `goalsData`
**Format**: JSON array of Goal objects

```javascript
localStorage.setItem('goalsData', JSON.stringify([
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    athleteId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    athleteName: "Иванов Иван",
    exerciseType: "pull-ups",
    targetValue: 10,
    startDate: "2025-11-01",
    endDate: "2025-11-30",
    description: "10 подтягиваний",
    status: "active",
    createdAt: "2025-11-01T10:00:00.000Z",
    updatedAt: "2025-11-03T14:30:00.000Z",
    completedAt: null
  },
  // ... more goals
]));
```

---

## Entity 2: Athlete (Enhanced)

### Purpose
Represents a student/athlete tracked in the system with dynamic sync support from Google Sheets.

### Schema

```javascript
{
  // Identity (NEW: stable ID for sync tracking)
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7", // string, UUID v4, IMMUTABLE (server-generated)

  // Basic Info
  "name": "Иванов Иван", // string, editable via Google Sheets
  "group": "Средняя", // string, enum: "Начинающие" | "Средняя" | "Продвинутая" | "Элитная"

  // Status (NEW: track active/inactive)
  "status": "active", // string, enum: "active" | "inactive"

  // Ordering (NEW: match Google Sheets row order)
  "order": 5, // number, non-negative integer, row number from Sheets

  // Performance Data (existing)
  "performanceData": {
    "2025-09": { "pullUps": 8, "pushUps": 15, "dips": 10 },
    "2025-10": { "pullUps": 10, "pushUps": 18, "dips": 12 },
    "2025-11": { "pullUps": 12, "pushUps": 20, "dips": 15 }
  },

  // All-Time Records (existing)
  "allTimeRecords": {
    "pullUps": 12,
    "pushUps": 20,
    "dips": 15
  },

  // Timestamps (NEW: sync tracking)
  "createdAt": "2025-09-01T08:00:00.000Z", // string, ISO 8601, when first added to system
  "syncedAt": "2025-11-03T14:30:00.000Z", // string, ISO 8601, last successful sync
  "deactivatedAt": null // string | null, ISO 8601, when marked inactive (removed from Sheets)
}
```

### Field Specifications

| Field | Type | Required | Editable (App) | Editable (Sheets) | Validation | Default |
|-------|------|----------|----------------|-------------------|------------|---------|
| `id` | string (UUID) | Yes | No (immutable) | No (immutable) | UUID v4 format | Server-generated |
| `name` | string | Yes | No | Yes | Non-empty | - |
| `group` | string (enum) | Yes | No | Yes | Valid group enum | - |
| `status` | string (enum) | Yes | Auto (sync) | No | "active" \| "inactive" | "active" |
| `order` | number (int) | Yes | No | Auto (row #) | Non-negative integer | Row number |
| `performanceData` | object | Yes | Yes (coach edits) | No | Valid month keys, non-negative values | `{}` |
| `allTimeRecords` | object | Yes | Auto (computed) | No | Non-negative values | `{}` |
| `createdAt` | string (ISO 8601) | Yes | No (immutable) | No | Valid ISO timestamp | `new Date().toISOString()` |
| `syncedAt` | string (ISO 8601) | Yes | Auto (sync) | No | Valid ISO timestamp | `new Date().toISOString()` |
| `deactivatedAt` | string \| null | No | Auto (sync) | No | Valid ISO timestamp or null | null |

### Status Lifecycle

```
[Sync from Sheets]
         │
         ↓
    ┌─────────┐
    │ active  │ ←──────┐
    └─────────┘        │
         │             │
         │ [Removed   │ [Re-added
         │  from       │  to Sheets
         │  Sheets]    │  with same ID]
         ↓             │
    ┌─────────┐       │
    │inactive │ ──────┘
    └─────────┘
```

**Status Rules**:
- **active**: Athlete currently in Google Sheets roster
- **inactive**: Athlete removed from Sheets but data preserved (archive)

**Status Transition Logic**:
```javascript
function updateAthleteStatus(athlete, sheetsAthletes) {
  const sheetsIds = sheetsAthletes.map(a => a.id);

  if (sheetsIds.includes(athlete.id)) {
    // In Sheets: active
    athlete.status = 'active';
    athlete.deactivatedAt = null;
    athlete.syncedAt = new Date().toISOString();
  } else {
    // Not in Sheets: inactive (if was previously active)
    if (athlete.status === 'active') {
      athlete.status = 'inactive';
      athlete.deactivatedAt = new Date().toISOString();
    }
  }

  return athlete;
}
```

### Validation Rules

**Name Validation**:
```javascript
function validateAthleteName(name) {
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: 'Имя спортсмена не может быть пустым'
    };
  }

  return { valid: true };
}
```

**Group Validation**:
```javascript
function validateAthleteGroup(group) {
  const validGroups = ['Начинающие', 'Средняя', 'Продвинутая', 'Элитная'];

  if (!validGroups.includes(group)) {
    return {
      valid: false,
      error: 'Некорректная группа'
    };
  }

  return { valid: true };
}
```

**Performance Data Validation**:
```javascript
function validatePerformanceData(performanceData) {
  for (const [month, records] of Object.entries(performanceData)) {
    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return {
        valid: false,
        error: `Некорректный формат месяца: ${month}`
      };
    }

    // Validate record values (non-negative integers)
    const { pullUps, pushUps, dips } = records;
    if (pullUps < 0 || pushUps < 0 || dips < 0) {
      return {
        valid: false,
        error: 'Показатели не могут быть отрицательными'
      };
    }
  }

  return { valid: true };
}
```

### Indexes

**Primary Index**:
- `id` (unique, for sync tracking and goal references)

**Secondary Indexes** (for filtering):
- `status` (filter active/inactive athletes)
- `group` (filter by training group)
- `order` (sort athletes by Sheets row order)

### localStorage Storage

**Key**: `athletesData`
**Format**: JSON array of Athlete objects

```javascript
localStorage.setItem('athletesData', JSON.stringify([
  {
    id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    name: "Иванов Иван",
    group: "Средняя",
    status: "active",
    order: 5,
    performanceData: {
      "2025-11": { pullUps: 12, pushUps: 20, dips: 15 }
    },
    allTimeRecords: { pullUps: 12, pushUps: 20, dips: 15 },
    createdAt: "2025-09-01T08:00:00.000Z",
    syncedAt: "2025-11-03T14:30:00.000Z",
    deactivatedAt: null
  },
  // ... more athletes
]));
```

---

## Relationships

### Goal → Athlete (Many-to-One)

**Foreign Key**: `Goal.athleteId` references `Athlete.id`

**Referential Integrity**:
- Goals persist even if athlete becomes inactive (archive)
- Goals are NOT deleted when athlete removed from Sheets
- Orphan goals (athleteId not found) are edge case (should not occur)

**Query Patterns**:
```javascript
// Find all goals for athlete
function getGoalsForAthlete(athleteId) {
  return goalsData.filter(goal => goal.athleteId === athleteId);
}

// Find athlete for goal
function getAthleteForGoal(goalId) {
  const goal = goalsData.find(g => g.id === goalId);
  return athletesData.find(a => a.id === goal.athleteId);
}
```

### Athlete Name Denormalization in Goal

**Denormalized Field**: `Goal.athleteName`

**Rationale**:
- Performance: Avoid lookup for every goal render (UI displays name)
- Simplicity: No JOIN operation needed for goal list view

**Consistency Strategy**:
- Update `athleteName` when athlete name changes in Sheets (during sync)
- Stale names acceptable temporarily (eventual consistency)

**Update Logic**:
```javascript
function syncAthleteNames() {
  goalsData.forEach(goal => {
    const athlete = athletesData.find(a => a.id === goal.athleteId);
    if (athlete && goal.athleteName !== athlete.name) {
      goal.athleteName = athlete.name; // Update denormalized name
      goal.updatedAt = new Date().toISOString();
    }
  });

  localStorage.setItem('goalsData', JSON.stringify(goalsData));
}
```

---

## Storage Schema (localStorage)

### Keys and Sizes

| Key | Format | Typical Size | Max Size (estimated) |
|-----|--------|--------------|----------------------|
| `athletesData` | JSON array | ~10KB (50 athletes) | ~50KB (250 athletes) |
| `goalsData` | JSON array | ~20KB (100 goals) | ~100KB (500 goals) |
| `exercisesData` | JSON array | ~1KB (20 exercises) | ~5KB (100 exercises) |
| `pendingChanges` | JSON array | ~5KB (queue) | ~20KB (large queue) |
| `lastSaved` | ISO timestamp | ~30 bytes | ~30 bytes |
| **TOTAL** | - | **~36KB** | **~175KB** |

**Browser Limits**:
- localStorage quota: 5-10MB (browser-dependent)
- Project usage: ~36KB typical, ~175KB worst case
- **Safety margin**: ~3% of quota (very safe)

### Backup Strategy

**Manual Export** (future feature):
```javascript
function exportData() {
  const backup = {
    athletes: athletesData,
    goals: goalsData,
    exercises: exercisesData,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wu-coach-backup-${Date.now()}.json`;
  a.click();
}
```

**Restore from Google Sheets**:
- If localStorage corrupted: clear all → sync → full restore
- Sheets is backup (secondary storage per constitution)

---

## Summary

### Key Changes from Current Data Model

**Goal Entity**:
- ✅ Added `updatedAt` timestamp (track last edit)
- ✅ Made all fields editable except `id` and `createdAt`
- ✅ Added comprehensive validation rules

**Athlete Entity**:
- ✅ Added `id` field (stable UUID for sync tracking)
- ✅ Added `status` field ("active" | "inactive")
- ✅ Added `order` field (match Google Sheets row order)
- ✅ Added `syncedAt` timestamp
- ✅ Added `deactivatedAt` timestamp

**New Features Enabled**:
- Goal editing with full field updates
- Offline edit queue coalescing
- Athlete sync with add/remove detection
- Historical data preservation (inactive athletes)
- Order synchronization with Google Sheets

### Migration Path

**From Current Schema → New Schema**:
```javascript
function migrateData() {
  // Migrate goals: add updatedAt (same as createdAt initially)
  goalsData.forEach(goal => {
    if (!goal.updatedAt) {
      goal.updatedAt = goal.createdAt || new Date().toISOString();
    }
  });

  // Migrate athletes: assign temporary UUIDs (will be replaced on first sync)
  athletesData.forEach((athlete, index) => {
    if (!athlete.id) {
      athlete.id = generateUUID(); // Temporary, replaced by server UUID on sync
    }
    if (!athlete.status) {
      athlete.status = 'active';
    }
    if (athlete.order === undefined) {
      athlete.order = index + 1; // Default: current array order
    }
    if (!athlete.createdAt) {
      athlete.createdAt = new Date().toISOString();
    }
    if (!athlete.syncedAt) {
      athlete.syncedAt = new Date().toISOString();
    }
    athlete.deactivatedAt = null;
  });

  // Save migrated data
  localStorage.setItem('goalsData', JSON.stringify(goalsData));
  localStorage.setItem('athletesData', JSON.stringify(athletesData));
}
```

**Run migration on app load** (one-time, idempotent):
```javascript
// In DOMContentLoaded event listener
if (!localStorage.getItem('migrationV2Complete')) {
  migrateData();
  localStorage.setItem('migrationV2Complete', 'true');
}
```
