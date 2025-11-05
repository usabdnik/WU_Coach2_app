# Data Model: Goal Fixes & Creation

**Feature**: 003-goal-fixes-and-creation
**Date**: 2025-11-03
**Phase**: 1 - Design

---

## Overview

This feature enhances two existing entities (**Goal** and **PendingChange**) without adding new entities. No database schema changes required (Google Sheets structure remains unchanged). All changes are client-side data handling improvements.

---

## Entity: Goal (Enhanced)

### Purpose
Represents a training goal for a specific athlete and exercise, tracked over time with offline-first persistence.

### Storage Locations
- **Primary**: `localStorage.goalsData` (JSON array)
- **Secondary**: Google Sheets "Goals" tab (synced periodically)
- **In-Memory**: `window.goalsData` (global array, loaded on page load)

### Schema

| Field | Type | Required | Description | Validation Rules | Default |
|-------|------|----------|-------------|------------------|---------|
| `id` | UUID v4 | ✅ Yes | Unique identifier (client or server generated) | Must be valid UUID | `generateUUID()` |
| `studentId` | UUID v4 | ✅ Yes | Reference to Athlete entity | Must exist in athletesData | - |
| `studentName` | String | ✅ Yes | Denormalized athlete name (for display) | Non-empty | - |
| `exerciseId` | UUID v4 | ✅ Yes | Reference to Exercise entity | Must exist in exercisesData | - |
| `exerciseName` | String | ✅ Yes | Denormalized exercise name (for display) | Non-empty | - |
| `startDate` | ISO Date | ✅ Yes | Goal start date (YYYY-MM-DD) | Valid date, not >1 year in future | - |
| `setDate` | ISO Date | ⚠️ Legacy | Alias for startDate (backward compatibility) | Same as startDate | Mirror of startDate |
| `endDate` | ISO Date | ✅ Yes | Goal end/target date (YYYY-MM-DD) | >= startDate, <= startDate + 365 days | - |
| `completionDate` | ISO Date | ⚠️ Legacy | Alias for endDate (backward compatibility) | Same as endDate | Mirror of endDate |
| `description` | String | ❌ No | Goal description (e.g., "12 подтягиваний") | <= 200 characters | `""` |
| `targetValue` | Number | ❌ No | Target repetitions/performance | Positive integer | `null` |
| `notes` | String | ❌ No | Additional coach notes | No limit (reasonable) | `""` |
| `status` | Enum | ✅ Yes | Goal lifecycle status | 'active' \| 'completed' \| 'cancelled' | `'active'` |
| `createdAt` | ISO Timestamp | ✅ Yes | Creation timestamp (ISO 8601) | Valid timestamp | `new Date().toISOString()` |
| `updatedAt` | ISO Timestamp | ✅ Yes | Last update timestamp (ISO 8601) | Valid timestamp, >= createdAt | `new Date().toISOString()` |

### Field Notes

**Dual Field Support (startDate/setDate, endDate/completionDate)**:
- **Reason**: Backward compatibility with existing Google Sheets data
- **Implementation**: Both fields mirrored on read/write
- **Migration**: No data migration needed, app handles both field names

**Status Field**:
- `'active'`: Goal in progress (default for new goals)
- `'completed'`: Goal achieved (manually marked or auto-detected)
- `'cancelled'`: Goal abandoned (rare, manual action)

**Denormalized Fields (studentName, exerciseName)**:
- **Reason**: Faster rendering (no joins), offline-first access
- **Trade-off**: Data duplication, manual sync required if names change
- **Justification**: Single-user app, names rarely change, read-heavy workload

### Validation Rules (Client-Side)

```javascript
function validateGoal(goal) {
    const errors = [];

    // Required fields
    if (!goal.id) errors.push('ID обязателен');
    if (!goal.studentId) errors.push('ID спортсмена обязателен');
    if (!goal.exerciseId) errors.push('ID упражнения обязателен');
    if (!goal.startDate) errors.push('Дата начала обязательна');
    if (!goal.endDate) errors.push('Дата окончания обязательна');

    // Date logic
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    if (isNaN(start.getTime())) errors.push('Некорректная дата начала');
    if (isNaN(end.getTime())) errors.push('Некорректная дата окончания');
    if (end < start) errors.push('Дата окончания должна быть позже даты начала');

    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) errors.push('Длительность цели не может превышать 1 год');

    // Description length
    if (goal.description && goal.description.length > 200) {
        errors.push('Описание не может превышать 200 символов');
    }

    // Status enum
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (goal.status && !validStatuses.includes(goal.status)) {
        errors.push('Некорректный статус цели');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}
```

### State Transitions

```
┌─────────┐
│ (new)   │
└────┬────┘
     │ createGoal()
     ▼
┌─────────────┐
│   active    │ ←──────────────┐
└──┬──────┬───┘                │
   │      │                    │
   │      │ toggleGoalCompletion() (unmark)
   │      │                    │
   │      ▼                    │
   │  ┌──────────┐             │
   │  │completed │─────────────┘
   │  └──────────┘
   │
   │ deleteGoal()
   ▼
┌───────────┐
│ cancelled │
└───────────┘
```

**Transition Rules**:
- New goals start as `active`
- Marking complete: `active` → `completed` (toggleGoalCompletion)
- Unmarking: `completed` → `active` (toggleGoalCompletion)
- Deletion: Any state → `cancelled` (soft delete, not removed from array)
- No direct transition to `cancelled` (always via deleteGoal)

**Note**: Current implementation doesn't use `cancelled` status (goals are removed from array on delete). Future enhancement may implement soft deletes.

### Indexing & Lookup

**Primary Access Patterns**:
1. **By Student**: `goalsData.filter(g => g.studentId === athleteId)` - Most common (display goals in athlete card)
2. **By ID**: `goalsData.find(g => g.id === goalId)` - For editing operations
3. **By Status**: `goalsData.filter(g => g.status === 'active')` - For active goals list

**Performance**:
- Array size: ~50-200 goals (20-50 athletes × 2-5 goals each)
- Filter operations: O(n), acceptable for this scale
- No indexing needed (small dataset, in-memory operations)

### Example Data

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "studentId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "studentName": "Иванов Пётр",
  "exerciseId": "ex-uuid-pullups",
  "exerciseName": "Подтягивания",
  "startDate": "2025-11-10",
  "setDate": "2025-11-10",
  "endDate": "2025-12-10",
  "completionDate": "2025-12-10",
  "description": "12 подтягиваний к концу месяца",
  "targetValue": 12,
  "notes": "",
  "status": "active",
  "createdAt": "2025-11-03T10:30:00.000Z",
  "updatedAt": "2025-11-03T10:30:00.000Z"
}
```

---

## Entity: PendingChange (Enhanced)

### Purpose
Tracks offline changes awaiting synchronization with Google Sheets. Part of offline-first architecture.

### Storage Locations
- **Primary**: `localStorage.pendingChanges` (JSON array)
- **In-Memory**: `window.pendingChanges` (global array)
- **Not Synced**: Cleared after successful server sync

### Schema

| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|------------------|
| `type` | Enum | ✅ Yes | Change category | 'goal' \| 'goal_edit' \| 'athlete' \| 'performance' |
| `action` | Enum | ⚠️ Conditional | Operation type (for type='goal') | 'create' \| 'delete' (only if type='goal') |
| `goalId` | UUID v4 | ⚠️ Conditional | Goal identifier (if type='goal' or 'goal_edit') | Valid UUID |
| `goalData` | Object | ⚠️ Conditional | Full goal data (if action='create') | Valid Goal object |
| `changes` | Object | ⚠️ Conditional | Changed fields only (if type='goal_edit') | Key-value pairs of changed fields |
| `timestamp` | ISO Timestamp | ✅ Yes | When change was made (for ordering) | Valid ISO 8601 timestamp |

### Type-Specific Structures

**Type: 'goal', Action: 'create'** (New Goal Creation):
```json
{
  "type": "goal",
  "action": "create",
  "goalId": "client-generated-uuid",
  "goalData": {
    "studentId": "athlete-uuid",
    "studentName": "Иванов Пётр",
    "exerciseId": "exercise-uuid",
    "exerciseName": "Подтягивания",
    "startDate": "2025-11-10",
    "endDate": "2025-12-10",
    "description": "12 подтягиваний",
    "status": "active",
    "createdAt": "2025-11-03T10:30:00Z"
  },
  "timestamp": "2025-11-03T10:30:00Z"
}
```

**Type: 'goal_edit'** (Existing Goal Edit):
```json
{
  "type": "goal_edit",
  "goalId": "server-uuid-existing-goal",
  "changes": {
    "startDate": "2025-11-15",
    "endDate": "2025-12-15",
    "updatedAt": "2025-11-03T14:30:00Z"
  },
  "timestamp": "2025-11-03T14:30:00Z"
}
```

**Type: 'goal', Action: 'delete'** (Goal Deletion):
```json
{
  "type": "goal",
  "action": "delete",
  "goalId": "uuid-to-delete",
  "timestamp": "2025-11-03T16:00:00Z"
}
```

### Change Coalescing

**Problem**: Multiple edits to same goal create redundant pending changes.

**Solution**: `coalescePendingChanges()` function merges changes:

```javascript
function coalescePendingChanges() {
    const coalesced = [];
    const goalEditMap = new Map();

    pendingChanges.forEach(change => {
        if (change.type === 'goal_edit') {
            const existing = goalEditMap.get(change.goalId);
            if (existing) {
                // Merge changes, keeping latest values
                existing.changes = { ...existing.changes, ...change.changes };
                existing.timestamp = change.timestamp; // Latest timestamp
            } else {
                goalEditMap.set(change.goalId, { ...change });
            }
        } else {
            // Non-edit changes pass through unchanged
            coalesced.push(change);
        }
    });

    // Add coalesced edits back
    goalEditMap.forEach(change => coalesced.push(change));

    return coalesced;
}
```

**Example**:
```javascript
// Before coalescing (3 edits to same goal)
[
  { type: 'goal_edit', goalId: 'abc', changes: { startDate: '2025-11-10' }, timestamp: 'T1' },
  { type: 'goal_edit', goalId: 'abc', changes: { endDate: '2025-12-10' }, timestamp: 'T2' },
  { type: 'goal_edit', goalId: 'abc', changes: { description: 'New desc' }, timestamp: 'T3' }
]

// After coalescing (1 merged edit)
[
  { type: 'goal_edit', goalId: 'abc', changes: { startDate: '2025-11-10', endDate: '2025-12-10', description: 'New desc' }, timestamp: 'T3' }
]
```

**When Applied**: Before sync operation starts (in `syncWithGoogleSheets()` function).

### Sync Protocol

**Step 1: Coalesce Changes**
```javascript
const coalescedChanges = coalescePendingChanges();
```

**Step 2: Process Each Change**
```javascript
for (const change of coalescedChanges) {
    if (change.type === 'goal' && change.action === 'create') {
        await createGoalOnServer(change);
    } else if (change.type === 'goal_edit') {
        await updateGoalOnServer(change);
    } else if (change.type === 'goal' && change.action === 'delete') {
        await deleteGoalOnServer(change);
    }
    // ... handle other types
}
```

**Step 3: Remove Successful Changes**
```javascript
pendingChanges = pendingChanges.filter(c => !successfulChangeIds.includes(c.timestamp));
localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
```

### Example Flow: Create Goal Offline → Sync

**T1: Goal Created (Offline)**
```javascript
const newGoal = {
    id: 'client-uuid-123',
    studentId: 'athlete-uuid',
    // ... other fields
};
goalsData.push(newGoal);
localStorage.setItem('goalsData', JSON.stringify(goalsData));

pendingChanges.push({
    type: 'goal',
    action: 'create',
    goalId: 'client-uuid-123',
    goalData: newGoal,
    timestamp: new Date().toISOString()
});
localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
```

**T2: Sync Started (Online)**
```javascript
// 1. Send to server
const response = await fetch(WEBAPP_URL, {
    method: 'POST',
    body: JSON.stringify({
        action: 'createGoal',
        goalData: change.goalData
    })
});

// 2. Server responds
const result = await response.json();
// { success: true, clientId: 'client-uuid-123', serverId: 'server-uuid-789' }

// 3. Replace client ID with server ID
const goal = goalsData.find(g => g.id === 'client-uuid-123');
goal.id = 'server-uuid-789';
localStorage.setItem('goalsData', JSON.stringify(goalsData));

// 4. Remove pending change
pendingChanges = pendingChanges.filter(c => c.goalId !== 'client-uuid-123');
localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
```

---

## Entity Relationships

```
┌──────────┐
│ Athlete  │
└────┬─────┘
     │ 1
     │
     │ has many
     │
     │ N
┌────▼─────┐
│   Goal   │
└────┬─────┘
     │ N
     │
     │ references
     │
     │ 1
┌────▼─────────┐
│   Exercise   │
└──────────────┘

┌──────────────┐
│     Goal     │
└──────┬───────┘
       │
       │ creates
       │
       ▼
┌──────────────┐
│PendingChange │
└──────────────┘
```

**Relationship Rules**:
- Each Goal belongs to one Athlete (`studentId` foreign key)
- Each Goal references one Exercise (`exerciseId` foreign key)
- Each PendingChange references zero or one Goal (`goalId`, nullable for non-goal changes)
- Athletes and Exercises are loaded from Google Sheets (not modified by this feature)

---

## Data Migrations

### Migration: migrateGoalIds() (Enhanced)

**Purpose**: Ensure all goals have UUID identifiers (addresses bugfix from commit ff46171).

**When**: On app load, before rendering UI (`initApp()` function).

**Implementation** (Enhanced Version):
```javascript
function migrateGoalIds() {
    let migrated = 0;
    let warnings = [];

    goalsData.forEach((goal, index) => {
        // Add UUID if missing
        if (!goal.id) {
            goal.id = generateUUID();
            migrated++;
            console.log(`🔧 Миграция: добавлен ID для цели ${index}: ${goal.exerciseName} (${goal.studentName})`);
        }

        // Warn about missing critical fields (non-blocking)
        if (!goal.exerciseName) {
            warnings.push(`⚠️ Цель ${goal.id}: отсутствует exerciseName`);
        }
        if (!goal.studentName) {
            warnings.push(`⚠️ Цель ${goal.id}: отсутствует studentName`);
        }

        // Auto-fix dual date fields (ensure both fields mirror each other)
        if (goal.startDate && !goal.setDate) {
            goal.setDate = goal.startDate;
        } else if (goal.setDate && !goal.startDate) {
            goal.startDate = goal.setDate;
        }

        if (goal.endDate && !goal.completionDate) {
            goal.completionDate = goal.endDate;
        } else if (goal.completionDate && !goal.endDate) {
            goal.endDate = goal.completionDate;
        }
    });

    if (migrated > 0) {
        localStorage.setItem('goalsData', JSON.stringify(goalsData));
        console.log(`✅ Миграция: добавлено ID для ${migrated} целей`);
    }

    if (warnings.length > 0) {
        console.warn('⚠️ Предупреждения миграции целей:', warnings);
    }

    return { migrated, warnings: warnings.length };
}
```

**Testing**: Run on production data with Иванов Петр's goals ("Выход силой", "передний вис") to verify.

---

## Performance Considerations

### localStorage Quotas

**Browser Limits**:
- Desktop: ~10MB (Chrome, Firefox, Safari)
- Mobile: ~5MB (iOS Safari, Android Chrome)

**Current Usage Estimate**:
- Athlete: ~200 bytes × 50 = ~10KB
- Exercise: ~100 bytes × 20 = ~2KB
- Goal: ~300 bytes × 200 = ~60KB
- PendingChanges: ~400 bytes × 50 = ~20KB
- **Total**: ~92KB (~1% of 5MB mobile quota)

**Conclusion**: No quota issues expected.

### Sync Performance

**Network Payload** (Creating 10 Goals):
```
Request: ~3KB (10 goals × ~300 bytes each)
Response: ~1KB (10 server IDs)
Total: ~4KB per sync operation
```

**Time Estimates**:
- 3G network (750 Kbps): ~50ms transfer time
- API processing: ~500ms (Google Apps Script)
- **Total**: ~600ms for 10 goals

**Optimization**: Batch all pending changes in single request (already implemented).

---

## Security Notes

**Client-Side Only** (MVP Phase):
- ❌ No input sanitization (XSS risk if goal descriptions contain scripts)
- ❌ No SQL injection protection (not applicable, no SQL database)
- ❌ No authentication (single coach, trusted user)

**Mitigation** (Current):
- Data only displayed in controlled UI contexts (no `innerHTML` with user content)
- Google Apps Script handles server-side validation
- HTTPS enforced by GitHub Pages

**Future Hardening** (Production Phase):
- ✅ DOMPurify for description field sanitization
- ✅ Content Security Policy headers
- ✅ Google OAuth authentication

---

## Data Model Change Summary

| Entity | Change Type | Fields Added/Modified | Breaking Change? |
|--------|-------------|----------------------|------------------|
| Goal | Enhanced | Added validation logic, state transitions | ❌ No (backward compatible) |
| PendingChange | Enhanced | Added `action='create'` case, `goalData` field | ❌ No (additive) |

**Backward Compatibility**: ✅ All changes are additive or enhancement-only. Existing data continues to work.

**Database Schema Changes**: ❌ None. Google Sheets structure unchanged.

---

**Data Model Design Complete** ✅

**Next Artifact**: contracts/google-apps-script-api.md (API contract specification)
