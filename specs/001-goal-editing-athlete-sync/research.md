# Research: Goal Editing & Dynamic Athlete Sync

**Feature**: 001-goal-editing-athlete-sync
**Date**: 2025-11-03
**Purpose**: Resolve technical unknowns and document architectural decisions

---

## Research Task 1: HTML5 Date Input Best Practices (Mobile)

### Question
How to implement mobile-friendly date pickers without external libraries on iOS Safari 14+ and Chrome Android 90+?

### Decision
**Use native `<input type="date">` HTML5 element**

### Rationale

**Browser Support (Target Platforms)**:
- iOS Safari 14+: ✅ Full support (native iOS date picker wheel)
- Chrome Android 90+: ✅ Full support (native Android date picker dialog)
- Both browsers provide excellent mobile-optimized native pickers

**Advantages**:
- Zero dependencies (aligns with Constitution Principle II)
- Native mobile UX (platform-consistent design)
- Accessibility built-in (screen reader support, keyboard navigation)
- Automatic validation (browser enforces valid dates)
- Touch-optimized by default (large touch targets, smooth scrolling)

**Russian Locale Formatting**:
- Input value is ISO 8601 format (YYYY-MM-DD) for JavaScript
- Display format follows device locale automatically
- Russian locale devices show "DD.MM.YYYY" format in picker
- No manual localization code needed

**Validation Strategy**:
```javascript
// Client-side validation (before save)
function validateGoalDates(startDate, endDate) {
  const start = new Date(startDate); // ISO string from input.value
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Некорректная дата' };
  }

  if (end <= start) {
    return {
      valid: false,
      error: 'Дата окончания должна быть после даты начала'
    };
  }

  return { valid: true };
}
```

**Fallback (Not Needed)**:
- Browsers that don't support `<input type="date">` (IE11, old Safari) fall back to text input
- Target browsers (iOS Safari 14+, Chrome Android 90+) have full support
- No polyfill required

### Alternatives Considered

**Alternative 1: Custom JavaScript Date Picker**
- Rejected: Violates zero dependencies principle (would need library or significant custom code)
- Rejected: Worse UX than native pickers (custom touch interactions, accessibility challenges)
- Rejected: Maintenance burden (handle browser quirks, touch edge cases)

**Alternative 2: Text Input with Manual Parsing**
- Rejected: Poor UX (no visual calendar, manual typing error-prone)
- Rejected: Validation complexity (multiple date formats to support)
- Rejected: Accessibility issues (no semantic date meaning)

**Alternative 3: Third-Party Library (flatpickr, Pikaday)**
- Rejected: Violates Constitution Principle II (zero dependencies)
- Rejected: Unnecessary complexity for simple date selection

### Implementation Notes

**HTML Structure**:
```html
<div class="form-group">
  <label for="goalStartDate">Дата начала</label>
  <input
    type="date"
    id="goalStartDate"
    class="date-input"
    required
    aria-label="Дата начала цели"
  >
</div>
```

**CSS Styling** (align with dark theme):
```css
.date-input {
  width: 100%;
  height: 48px; /* Touch-friendly */
  padding: 12px 15px;
  background: #2a2d3a; /* Input color from palette */
  color: #ffffff; /* Text primary */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 16px; /* Prevents iOS zoom */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial;
}

.date-input:focus {
  outline: none;
  border-color: #4c9eff; /* Primary color */
  box-shadow: 0 0 0 3px rgba(76, 158, 255, 0.1);
}
```

**JavaScript Integration**:
- Read value: `const dateValue = document.getElementById('goalStartDate').value; // "2025-11-03"`
- Set value: `document.getElementById('goalStartDate').value = '2025-11-03';`
- Store in localStorage: Already ISO format, no conversion needed
- Display to user: Format with `new Date(dateValue).toLocaleDateString('ru-RU')` → "03.11.2025"

---

## Research Task 2: LocalStorage ID Generation Strategy

### Question
How to generate stable unique IDs for athletes and goals without server-side UUID generation?

### Decision
**Use `crypto.randomUUID()` browser API with fallback to custom implementation**

### Rationale

**Browser Support (Target Platforms)**:
- iOS Safari 14+: ❌ No support (added in Safari 15.4+)
- Chrome Android 90+: ❌ No support (added in Chrome 92+)
- **Need polyfill for target browsers**

**Solution: Custom UUID v4 Implementation**:
```javascript
// Lightweight UUID v4 generator (zero dependencies)
function generateUUID() {
  // Check for native support first
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: Custom UUID v4 implementation
  // Pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

**Why UUID v4 Over Alternatives**:

1. **Globally Unique**: Collision probability negligible (1 in 2^122)
2. **Offline-Safe**: Can generate IDs without server coordination
3. **Client-Side**: No network dependency (works offline)
4. **Standard Format**: Recognizable 36-character string (8-4-4-4-12)
5. **Immutable**: Once assigned, ID never changes (stable across syncs)

**ID Assignment Strategy**:

**For Goals**:
```javascript
function createGoal(athleteId, exerciseType, targetValue, startDate, endDate, description) {
  const goal = {
    id: generateUUID(), // "550e8400-e29b-41d4-a716-446655440000"
    athleteId,
    athleteName: athletesData.find(a => a.id === athleteId).name,
    exerciseType,
    targetValue,
    startDate,
    endDate,
    description,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null
  };
  goalsData.push(goal);
  localStorage.setItem('goalsData', JSON.stringify(goalsData));
  return goal;
}
```

**For Athletes (Sync from Google Sheets)**:
- **Option A**: Server generates UUID in Google Apps Script → client receives
- **Option B**: Client generates UUID on first sync → uploads to Sheets
- **Chosen**: **Option A** (server-side generation in Google Apps Script)

**Rationale for Option A**:
- Sheets is source of truth for athlete roster (Constitution sync strategy)
- Server can enforce UUID uniqueness across all clients
- Avoids potential collision if multiple coaches sync simultaneously
- Simpler client code (receive ID, don't generate)

**Google Sheets Schema Update Required**:
- Add "ID" column (column A or hidden column)
- Google Apps Script generates UUID on row insertion if ID empty
- Apps Script returns ID in sync response for client-side mapping

### Alternatives Considered

**Alternative 1: Timestamp-Based IDs**
- Format: `athlete_1730649600000` (Unix timestamp in ms)
- Rejected: Collision risk if two coaches create goals at same millisecond
- Rejected: Not globally unique (depends on client clock accuracy)
- Rejected: Less readable, harder to debug

**Alternative 2: Google Sheets Row Numbers**
- Format: `athlete_row_5`, `goal_row_12`
- Rejected: Unstable (row numbers shift when rows deleted above)
- Rejected: Doesn't work for goals (no Google Sheets row for goals)
- Rejected: Breaks if Sheet rows reordered

**Alternative 3: Nanoid / Short IDs**
- Format: `V1StGXR8_Z5jdHi6B-myT` (21 characters)
- Rejected: Requires external library (nanoid) or complex custom implementation
- Rejected: UUID v4 is simpler and more standard
- Benefit: Shorter strings (21 vs 36 chars) - negligible in this use case

### Implementation Notes

**localStorage Storage**:
```javascript
// Goal with UUID
const goal = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  athleteId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  // ... other fields
};

// Athlete with UUID (from Google Sheets)
const athlete = {
  id: "7c9e6679-7425-40de-944b-e07fc1f90ae7", // Server-generated
  name: "Иванов Иван",
  // ... other fields
};
```

**Sync Payload**:
```javascript
// pendingChanges[] includes goal ID for updates
pendingChanges.push({
  type: 'goal_edit',
  goalId: "550e8400-e29b-41d4-a716-446655440000",
  changes: {
    startDate: "2025-11-10",
    endDate: "2025-12-10",
    description: "12 подтягиваний",
    updatedAt: "2025-11-03T10:30:00Z"
  }
});
```

**ID Lookup Performance**:
- Array.find() for ~100 goals: acceptable (<1ms on mobile)
- Consider Map-based index if scale exceeds 1000 goals (unlikely)

---

## Research Task 3: Athlete Sync Conflict Resolution Patterns

### Question
How to handle conflicts when both Google Sheets and local app have changes between syncs?

### Decision
**Hybrid strategy: Sheets wins for roster, local wins for performance/goals**

### Rationale

**Conflict Resolution Matrix**:

| Data Type | Source of Truth | Conflict Strategy | Rationale |
|-----------|----------------|-------------------|-----------|
| Athlete list (who) | Google Sheets | Sheets wins (replace) | Coach manages roster in Sheets (central authority) |
| Athlete names | Google Sheets | Sheets wins (update) | Name corrections made in Sheets |
| Athlete order | Google Sheets | Sheets wins (reorder) | Sheets controls visual order |
| Performance data | Local app | Local wins (keep) | Coach enters performance on mobile (field data) |
| Goals | Local app | Local wins (sync up) | Coach creates/edits goals on mobile |
| pendingChanges[] | Local app | Upload to Sheets | Queue persists until successful sync |

**Sync Algorithm** (Pseudo-code):
```javascript
async function syncWithGoogleSheets() {
  // 1. Upload pending local changes FIRST (local wins for goals/performance)
  const response = await fetch(WEBAPP_URL, {
    method: 'POST',
    body: JSON.stringify({ pendingChanges })
  });

  // 2. Receive fresh data from Sheets (Sheets wins for roster)
  const { athletes, exercises, goals } = await response.json();

  // 3. Merge athletes (detect adds/removes/updates)
  const athleteChanges = mergeAthleteRoster(athletesData, athletes);

  // 4. Update local storage with merged data
  athletesData = athletes; // Replace athlete roster (Sheets wins)
  exercisesData = exercises; // Replace exercises (Sheets wins)
  // Keep existing performance data (local wins)
  mergePerformanceData(athletesData, existingPerformanceData);

  // 5. Clear pending changes (sync complete)
  pendingChanges = [];

  // 6. Save to localStorage
  saveAllData();

  // 7. Display sync summary
  showSyncNotification(athleteChanges);
}

function mergeAthleteRoster(localAthletes, sheetsAthletes) {
  const localIds = new Set(localAthletes.map(a => a.id));
  const sheetsIds = new Set(sheetsAthletes.map(a => a.id));

  // Detect changes
  const added = sheetsAthletes.filter(a => !localIds.has(a.id));
  const removed = localAthletes.filter(a => !sheetsIds.has(a.id));
  const updated = sheetsAthletes.filter(a => localIds.has(a.id));

  // Mark removed athletes as inactive (preserve data)
  removed.forEach(athlete => {
    athlete.status = 'inactive';
    athlete.deactivatedAt = new Date().toISOString();
  });

  // Merge: keep removed (inactive) + add sheets athletes
  const merged = [
    ...removed, // Inactive athletes (historical data)
    ...sheetsAthletes.map(a => ({ ...a, status: 'active' })) // Active athletes from Sheets
  ];

  return { added, removed, updated, merged };
}
```

**Edge Case Handling**:

1. **Athlete removed in Sheets, has local goals**:
   - Solution: Mark athlete inactive, preserve all goals
   - Display in "Архив" (Archive) view (separate tab/filter)

2. **Athlete name changed in Sheets**:
   - Solution: ID-based tracking, update name, preserve performance
   - No user action needed (automatic)

3. **Athlete re-added after removal (same name)**:
   - Solution: Check if ID matches previous athlete
   - If ID matches: Reactivate (status → active, restore to main list)
   - If ID different: Treat as new athlete (fresh start)

4. **Performance edited locally, athlete removed in Sheets**:
   - Solution: Performance edit syncs first (uploads before roster update)
   - Athlete then marked inactive, performance preserved

5. **Goal edited locally, associated athlete removed**:
   - Solution: Goal remains valid (athlete ID still exists in inactive list)
   - Goal visible in Archive view with athlete's historical data

### Alternatives Considered

**Alternative 1: Last-Write-Wins (Timestamp-Based)**
- Rejected: Requires server timestamps and clock sync
- Rejected: Loses data if timestamps incorrect
- Rejected: Complex to implement correctly

**Alternative 2: Manual Conflict Resolution (UI Prompts)**
- Rejected: Poor UX (coach must resolve conflicts during sync)
- Rejected: Interrupts workflow (mobile usage during training)
- Rejected: Over-engineered for simple roster changes

**Alternative 3: Operational Transform (CRDT)**
- Rejected: Extreme over-engineering for this use case
- Rejected: Requires complex data structure (CRDT)
- Rejected: No libraries available (zero dependencies constraint)

### Implementation Notes

**Sync Summary Notification**:
```javascript
function showSyncNotification(athleteChanges) {
  const { added, removed } = athleteChanges;
  const message = `Добавлено: ${added.length}, Удалено: ${removed.length}`;

  // Display notification banner (5-second auto-dismiss)
  const notification = document.getElementById('syncNotification');
  notification.textContent = message;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 5000);

  // Highlight changed athletes (visual indicator)
  added.forEach(athlete => {
    const card = document.querySelector(`[data-athlete-id="${athlete.id}"]`);
    card.classList.add('newly-added'); // Temporary highlight class
  });

  setTimeout(() => {
    document.querySelectorAll('.newly-added').forEach(card => {
      card.classList.remove('newly-added');
    });
  }, 5000);
}
```

**Performance Consideration**:
- Sync algorithm O(n) where n = number of athletes (~50)
- Acceptable performance on mobile (<10ms for merge operation)

---

## Research Task 4: Google Apps Script API Update Requirements

### Question
What API changes are needed in Google Apps Script to support goal editing and athlete sync?

### Decision
**Add new operation types to existing pendingChanges[] API + enhance response format**

### Current API (Baseline)

**Endpoint**: `https://script.google.com/macros/s/{SCRIPT_ID}/exec`

**Request Format**:
```javascript
POST /exec
Content-Type: application/json

{
  "pendingChanges": [
    {
      "type": "goal_create",
      "goalId": "uuid",
      "athleteId": "uuid",
      "exerciseType": "pull-ups",
      "targetValue": 10,
      "startDate": "2025-11-01",
      "endDate": "2025-11-30",
      "description": "10 подтягиваний",
      "createdAt": "2025-11-01T10:00:00Z"
    },
    {
      "type": "goal_complete",
      "goalId": "uuid",
      "completedAt": "2025-11-15T14:30:00Z"
    },
    {
      "type": "performance_update",
      "athleteId": "uuid",
      "month": "2025-11",
      "exerciseType": "pull-ups",
      "value": 12
    }
  ]
}
```

**Current Response**:
```javascript
{
  "success": true,
  "athletesData": [...],
  "exercisesData": [...],
  "goalsData": [...]
}
```

### Required API Changes

**1. New Operation Type: `goal_edit`**
```javascript
{
  "type": "goal_edit",
  "goalId": "550e8400-e29b-41d4-a716-446655440000",
  "changes": {
    "startDate": "2025-11-10",      // Optional: only if changed
    "endDate": "2025-12-10",        // Optional: only if changed
    "description": "12 подтягиваний", // Optional: only if changed
    "targetValue": 12,               // Optional: only if changed
    "exerciseType": "pull-ups",      // Optional: only if changed
    "updatedAt": "2025-11-03T10:30:00Z" // Required: timestamp of edit
  }
}
```

**Apps Script Handler**:
```javascript
function handleGoalEdit(operation) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Goals');
  const goalId = operation.goalId;
  const changes = operation.changes;

  // Find goal row by ID (ID column in Goals sheet)
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === goalId); // Column A = ID

  if (rowIndex === -1) {
    // Goal not found: create new (was deleted in Sheets, re-create)
    return handleGoalCreate(operation);
  }

  // Update changed fields (map to column indexes)
  if (changes.startDate) sheet.getRange(rowIndex + 1, 3).setValue(changes.startDate);
  if (changes.endDate) sheet.getRange(rowIndex + 1, 4).setValue(changes.endDate);
  if (changes.description) sheet.getRange(rowIndex + 1, 5).setValue(changes.description);
  if (changes.targetValue) sheet.getRange(rowIndex + 1, 6).setValue(changes.targetValue);
  if (changes.exerciseType) sheet.getRange(rowIndex + 1, 7).setValue(changes.exerciseType);
  sheet.getRange(rowIndex + 1, 8).setValue(changes.updatedAt); // Last modified

  return { success: true, goalId };
}
```

**2. Enhanced Response Format: Athlete Sync Summary**
```javascript
{
  "success": true,
  "syncSummary": {
    "athletesAdded": 3,
    "athletesRemoved": 1,
    "goalsSynced": 5,
    "timestamp": "2025-11-03T10:35:00Z"
  },
  "athletesData": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7", // UUID generated by Apps Script
      "name": "Иванов Иван",
      "group": "Средняя",
      "order": 1, // Row number from Sheets
      "status": "active",
      "syncedAt": "2025-11-03T10:35:00Z"
    },
    // ... more athletes
  ],
  "exercisesData": [...],
  "goalsData": [...]
}
```

**3. Athlete UUID Generation (Apps Script)**
```javascript
function generateUUID() {
  return Utilities.getUuid(); // Built-in Apps Script function
}

function ensureAthleteIDs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Athletes');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) { // Skip header row
    const idCell = sheet.getRange(i + 1, 1); // Column A = ID
    if (!idCell.getValue()) {
      // No ID assigned: generate and assign
      const uuid = generateUUID();
      idCell.setValue(uuid);
    }
  }
}

function doPost(e) {
  // Ensure all athletes have IDs before processing sync
  ensureAthleteIDs();

  // ... rest of sync logic
}
```

### Google Sheets Schema Updates

**Athletes Sheet**:
```
Column A: ID (UUID, auto-generated if empty)
Column B: Name (Фамилия Имя)
Column C: Group (Начинающие, Средняя, Продвинутая, Элитная)
Column D: Status (Active, Inactive) - optional, managed by script
```

**Goals Sheet** (NEW - create if doesn't exist):
```
Column A: ID (UUID from client)
Column B: Athlete ID (UUID reference)
Column C: Start Date (YYYY-MM-DD)
Column D: End Date (YYYY-MM-DD)
Column E: Description (Russian text)
Column F: Target Value (number)
Column G: Exercise Type (pull-ups, push-ups, dips)
Column H: Status (active, completed, expired)
Column I: Created At (ISO timestamp)
Column J: Updated At (ISO timestamp)
Column K: Completed At (ISO timestamp or empty)
```

### Implementation Notes

**Backward Compatibility**:
- Old operation types (goal_create, goal_complete, performance_update) still work
- New clients send goal_edit, old Apps Script treats as no-op (graceful degradation)
- Response includes syncSummary (optional field, old clients ignore)

**Error Handling**:
```javascript
// Apps Script error response
{
  "success": false,
  "error": "Goal ID not found",
  "goalId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Rate Limiting**:
- Apps Script quota: 6 minutes execution time per day (free tier)
- Sync operation ~2-5 seconds → ~72-180 syncs/day max
- For single coach: acceptable (5-10 syncs per training session)

---

## Research Task 5: Offline Edit Queue Management

### Question
How to handle multiple edits to the same goal while offline?

### Decision
**Coalesce edits into single final state per goal ID**

### Rationale

**Problem**: Coach edits goal dates offline, then edits description, then edits target value. Without coalescing, pendingChanges[] contains 3 separate goal_edit operations for same goal.

**Solution**: Merge all edits for same goal ID into single operation before sync.

**Implementation**:
```javascript
function addGoalEditToQueue(goalId, changes) {
  // Find existing goal_edit operation for this goal ID
  const existingIndex = pendingChanges.findIndex(
    op => op.type === 'goal_edit' && op.goalId === goalId
  );

  if (existingIndex !== -1) {
    // Merge changes into existing operation (update fields)
    const existing = pendingChanges[existingIndex];
    existing.changes = {
      ...existing.changes,
      ...changes, // New changes overwrite old
      updatedAt: new Date().toISOString() // Latest timestamp wins
    };
  } else {
    // No existing operation: add new
    pendingChanges.push({
      type: 'goal_edit',
      goalId,
      changes: {
        ...changes,
        updatedAt: new Date().toISOString()
      }
    });
  }

  // Save to localStorage
  localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
}
```

**Benefits**:
- Reduces sync payload size (1 operation instead of N)
- Faster sync (fewer server-side updates)
- Simpler conflict resolution (single final state)
- Preserves user intent (latest edit wins for each field)

**Edge Case: Edit → Complete → Edit Again**:
```javascript
// Scenario: Coach edits goal, marks complete, then edits again offline
// pendingChanges[] state:
[
  { type: 'goal_edit', goalId: 'abc', changes: { startDate: '2025-11-10', updatedAt: 'T1' } },
  { type: 'goal_complete', goalId: 'abc', completedAt: 'T2' },
  { type: 'goal_edit', goalId: 'abc', changes: { description: 'Updated', updatedAt: 'T3' } }
]

// Problem: Two goal_edit operations separated by goal_complete
// Solution: Don't coalesce across different operation types
// Sync order: Edit1 → Complete → Edit2 (sequential, respects timeline)
```

**Coalescing Rules**:
- Coalesce only consecutive goal_edit operations with same goalId
- Stop coalescing when encountering different operation type (goal_complete, performance_update)
- Preserve operation order (FIFO queue)

**Optimized Implementation**:
```javascript
function coalescePendingChanges() {
  const coalesced = [];
  const editMap = new Map(); // goalId → merged changes

  pendingChanges.forEach(op => {
    if (op.type === 'goal_edit') {
      const goalId = op.goalId;
      if (editMap.has(goalId)) {
        // Merge with existing edit
        const existing = editMap.get(goalId);
        existing.changes = {
          ...existing.changes,
          ...op.changes,
          updatedAt: op.changes.updatedAt // Keep latest timestamp
        };
      } else {
        // First edit for this goal
        editMap.set(goalId, { ...op });
      }
    } else {
      // Non-edit operation: flush current edits, add operation
      editMap.forEach(edit => coalesced.push(edit));
      editMap.clear();
      coalesced.push(op);
    }
  });

  // Flush remaining edits
  editMap.forEach(edit => coalesced.push(edit));

  return coalesced;
}

async function syncData() {
  // Coalesce edits before syncing
  const coalescedChanges = coalescePendingChanges();

  const response = await fetch(WEBAPP_URL, {
    method: 'POST',
    body: JSON.stringify({ pendingChanges: coalescedChanges })
  });

  // ... rest of sync logic
}
```

### Alternatives Considered

**Alternative 1: Queue Each Edit Separately**
- Rejected: Inefficient (multiple API operations for same goal)
- Rejected: Larger sync payload (network cost on mobile)
- Rejected: Slower sync (N updates instead of 1)

**Alternative 2: Keep Only Latest Edit (Discard Previous)**
- Rejected: Loses partial field updates (if edit 1 changes dates, edit 2 changes description, need both)
- Benefit: Simpler logic (just replace) - but loses data

**Alternative 3: Single "Latest State" Snapshot (No Queue)**
- Rejected: Loses operation history (can't replay timeline)
- Rejected: Can't handle interleaved operations (edit → complete → edit)

### Implementation Notes

**Testing Scenario**:
1. Coach offline: Edit goal dates (2025-11-01 to 2025-11-10)
2. Coach offline: Edit same goal description ("10 pull-ups" to "12 pull-ups")
3. Coach offline: Edit same goal target value (10 to 12)
4. Coach goes online: Press sync
5. Expected: 1 goal_edit operation sent with all 3 changes merged

**Data Integrity**:
- localStorage write after each edit (persistence)
- Coalescing happens in-memory before sync (non-destructive)
- If sync fails, full pendingChanges[] queue preserved for retry

---

## Summary: All Research Tasks Resolved ✅

| Research Task | Decision | Rationale |
|---------------|----------|-----------|
| Date Input | Native `<input type="date">` | Zero dependencies, native mobile UX, full browser support |
| ID Generation | crypto.randomUUID() with fallback | Standard UUID v4, offline-safe, negligible collision risk |
| Sync Conflicts | Hybrid (Sheets wins roster, local wins data) | Clear ownership, preserves field data, simple to reason about |
| API Updates | Add goal_edit operation + sync summary | Backward compatible, minimal changes, enhanced response |
| Edit Queue | Coalesce consecutive edits per goal ID | Efficient sync, smaller payload, preserves all changes |

### All NEEDS CLARIFICATION Items Resolved

- ✅ **Date localization**: Native input handles Russian locale automatically
- ✅ **crypto.randomUUID() support**: Polyfill included for iOS Safari 14 / Chrome Android 90
- ✅ **Google Sheets row stability**: Use UUID column (not row numbers) for stable IDs
- ✅ **localStorage performance**: ~100KB typical usage, <10ms write latency (acceptable)

### Next Phase: Design Artifacts (Phase 1)

Ready to proceed with:
1. data-model.md (entity schemas, validation rules, state machines)
2. contracts/sync-api.md (API specification, request/response formats)
3. quickstart.md (implementation guide, line number references)
4. Update agent context (Claude.md enhancements)
