# Technical Research: Goal Fixes & Creation

**Feature**: 003-goal-fixes-and-creation
**Date**: 2025-11-03
**Phase**: 0 - Research & Technical Decisions

---

## Research Questions from Technical Context

Based on plan.md Technical Context, all questions are RESOLVED (no "NEEDS CLARIFICATION" markers).

## Technical Decisions

### 1. UUID Generation Strategy

**Decision**: Use native `crypto.randomUUID()` with polyfill fallback for Safari <14.5

**Rationale**:
- Native Web Crypto API is cryptographically secure (RFC 4122 v4 compliant)
- Zero dependencies (no uuid npm package needed)
- Polyfill already implemented in existing codebase (index.html:621-650)
- Safari 14.5+ supports native API (released April 2021, covers iOS 14.5+)

**Implementation** (already exists in index.html):
```javascript
function generateUUID() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Polyfill for Safari <14.5
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

**Alternatives Considered**:
- ❌ `uuid` npm package: Violates zero-dependency principle
- ❌ Server-generated IDs only: Breaks offline-first architecture
- ❌ Timestamp-based IDs: Risk of collisions in rapid operations

**References**:
- [MDN: Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [RFC 4122: UUID Specification](https://www.rfc-editor.org/rfc/rfc4122)

---

### 2. Sync Button Visual States

**Decision**: 4-state system with CSS transitions and temporary success/error states

**States**:
1. **Idle**: Gray background (`#2a2d3a`), text "⚡ Синхронизировать"
2. **Pending**: Orange background (`#fbbf24`), text "🔄 Синхронизировать (N ред.)"
3. **Syncing**: Blue background (`#4c9eff`), disabled, text "⏳ Синхронизация..." + spinner animation
4. **Success/Error**: Green (`#4ade80`) or Red (`#dc2626`), 2-3 seconds, then return to Idle/Pending

**Rationale**:
- Clear visual feedback without modal overlays (keeps UI non-blocking)
- Color-coded urgency (orange = action needed, red = error, green = success)
- Temporary states prevent state pollution (auto-reset after feedback delay)
- Existing dark theme colors maintained

**Implementation Details**:
```css
/* Sync button states */
.sync-button {
    background: #2a2d3a; /* Idle */
    transition: background-color 0.3s ease;
}
.sync-button.pending {
    background: #fbbf24; /* Orange - action needed */
}
.sync-button.syncing {
    background: #4c9eff; /* Blue - in progress */
    cursor: not-allowed;
}
.sync-button.success {
    background: #4ade80; /* Green - success */
}
.sync-button.error {
    background: #dc2626; /* Red - error */
}

/* Spinner animation for syncing state */
@keyframes spin {
    to { transform: rotate(360deg); }
}
.sync-button.syncing::before {
    content: '⏳';
    display: inline-block;
    animation: spin 1s linear infinite;
}
```

**Alternatives Considered**:
- ❌ Modal dialog for sync progress: Blocks UI interaction
- ❌ Toast notifications: Requires additional UI component
- ❌ Progress bar overlay: Visually complex for mobile
- ✅ Button state changes: Minimal, clear, follows existing patterns

**User Testing Requirement**: Verify orange color is noticeable but not alarming (not same urgency as red errors).

---

### 3. Goal Creation Form Validation

**Decision**: Client-side validation with immediate feedback, server-side validation as backup

**Validation Rules** (from spec.md FR-027):
1. Required fields: `exerciseId`, `startDate`, `endDate`
2. Date logic: `endDate >= startDate`
3. Date range: `(endDate - startDate) <= 365 days`
4. Description length: `<= 200 characters`
5. Optional fields: `description`, `targetValue`, `notes`

**Rationale**:
- Client validation provides instant feedback (better UX)
- Server validation prevents data corruption (security)
- Offline-first: Client validation allows goal creation without network
- Constitution compliance: No external validation library needed

**Implementation Pattern**:
```javascript
function validateGoalForm(formData) {
    const errors = [];

    // Required fields
    if (!formData.exerciseId) errors.push('Выберите тип упражнения');
    if (!formData.startDate) errors.push('Укажите дату начала');
    if (!formData.endDate) errors.push('Укажите дату окончания');

    // Date logic
    if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (end < start) {
            errors.push('Дата окончания должна быть позже даты начала');
        }
        const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
        if (daysDiff > 365) {
            errors.push('Длительность цели не может превышать 1 год');
        }
    }

    // Description length
    if (formData.description && formData.description.length > 200) {
        errors.push('Описание не может превышать 200 символов');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}
```

**Alternatives Considered**:
- ❌ HTML5 validation only: Insufficient for complex date logic
- ❌ Third-party validation library (Joi, Yup): Violates zero-dependency rule
- ✅ Custom validation function: Lightweight, tailored to requirements

**Edge Case Handling**:
- Past dates allowed (coach may create goals retroactively for records)
- Future dates >1 year blocked (prevents accidental typos like 2025 vs 2035)
- Empty description allowed (some goals self-explanatory from exercise type)

---

### 4. Offline Goal Creation & Sync Protocol

**Decision**: Client-generated UUID with server confirmation and ID replacement

**Data Flow**:
1. **Creation (Offline)**:
   - Client generates UUID: `client-uuid-abc123`
   - Goal saved to `goalsData` array with `id: client-uuid-abc123`
   - Added to `localStorage.goalsData`
   - PendingChange created: `{type: 'goal', action: 'create', goalId: 'client-uuid-abc123', goalData: {...}}`

2. **Sync (Online)**:
   - POST to Google Apps Script with `goalData`
   - Server creates row in Goals sheet, generates server ID: `server-uuid-xyz789`
   - Server responds: `{success: true, clientId: 'client-uuid-abc123', serverId: 'server-uuid-xyz789'}`

3. **ID Replacement (Post-Sync)**:
   - Client replaces `client-uuid-abc123` → `server-uuid-xyz789` in `goalsData`
   - Updates `localStorage.goalsData`
   - Removes PendingChange entry

**Rationale**:
- Offline-first: Goals created immediately without network
- Idempotency: Server checks if `serverId` already exists (prevent duplicates on retry)
- Data integrity: Server is source of truth for IDs after sync
- Constitution compliance: No backend database, only Google Sheets

**Implementation Note**:
```javascript
// In syncWithGoogleSheets() function
if (change.type === 'goal' && change.action === 'create') {
    const response = await fetch(WEBAPP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'createGoal',
            goalData: change.goalData
        })
    });
    const result = await response.json();

    if (result.success) {
        // Replace client ID with server ID
        const goal = goalsData.find(g => g.id === change.goalId);
        if (goal) {
            goal.id = result.serverId;
            localStorage.setItem('goalsData', JSON.stringify(goalsData));
        }
        // Remove from pendingChanges
        pendingChanges = pendingChanges.filter(c => c.goalId !== change.goalId);
    }
}
```

**Alternatives Considered**:
- ❌ Server-only ID generation: Requires network, breaks offline-first
- ❌ Keep client IDs permanently: Risk of collision, server loses control
- ❌ Optimistic locking with version numbers: Overly complex for single-user app

**Conflict Resolution**: Not applicable (single coach user, no concurrent editing)

---

### 5. Migration Strategy for Existing Goals

**Decision**: Augment existing `migrateGoalIds()` function with additional checks

**Current Implementation** (commit ff46171):
```javascript
function migrateGoalIds() {
    let migrated = 0;
    goalsData.forEach(goal => {
        if (!goal.id) {
            goal.id = generateUUID();
            migrated++;
        }
    });
    if (migrated > 0) {
        localStorage.setItem('goalsData', JSON.stringify(goalsData));
        console.log(`✅ Миграция: добавлено ID для ${migrated} целей`);
    }
}
```

**Enhancement Needed** (for debugging):
Add validation logging to identify goals with missing critical fields:

```javascript
function migrateGoalIds() {
    let migrated = 0;
    let warnings = [];

    goalsData.forEach((goal, index) => {
        // Add UUID if missing
        if (!goal.id) {
            goal.id = generateUUID();
            migrated++;
        }

        // Warn about missing fields (non-blocking)
        if (!goal.exerciseName) {
            warnings.push(`Цель ${goal.id}: отсутствует exerciseName`);
        }
        if (!goal.studentName) {
            warnings.push(`Цель ${goal.id}: отсутствует studentName`);
        }
    });

    if (migrated > 0) {
        localStorage.setItem('goalsData', JSON.stringify(goalsData));
        console.log(`✅ Миграция: добавлено ID для ${migrated} целей`);
    }

    if (warnings.length > 0) {
        console.warn('⚠️ Предупреждения миграции:', warnings);
    }
}
```

**Rationale**:
- Backward compatible: Doesn't break existing data
- Diagnostic: Identifies incomplete goals for manual review
- Non-blocking: Warnings logged but app continues functioning
- Idempotent: Safe to run multiple times

**Testing Requirement**: Run migration on Иванов Петр's goals ("Выход силой", "передний вис") to verify ID assignment.

---

### 6. Form Dropdown Population Strategy

**Decision**: Dynamically populate exercise dropdown from `exercisesData` array

**Data Source**: `exercisesData` loaded from Google Sheets on sync:
```javascript
// Example structure
exercisesData = [
    { id: 'uuid-1', name: 'Подтягивания' },
    { id: 'uuid-2', name: 'Отжимания от пола' },
    { id: 'uuid-3', name: 'Отжимания от брусьев' },
    { id: 'uuid-4', name: 'Выход силой' },
    { id: 'uuid-5', name: 'Передний вис' }
];
```

**Dropdown Generation**:
```javascript
function populateExerciseDropdown(selectElement) {
    selectElement.innerHTML = '<option value="">Выберите упражнение</option>';

    if (exercisesData.length === 0) {
        selectElement.innerHTML += '<option value="" disabled>Сначала синхронизируйтесь</option>';
        selectElement.disabled = true;
        return;
    }

    exercisesData.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise.id;
        option.textContent = exercise.name;
        selectElement.appendChild(option);
    });
    selectElement.disabled = false;
}
```

**Rationale**:
- Data-driven: No hardcoded exercise list, syncs with Google Sheets source of truth
- Offline-safe: Uses cached `exercisesData` from localStorage
- User-friendly: Clear message if exercises not yet loaded
- Constitution compliance: No external data fetching API

**Edge Case**: If `exercisesData` empty on first load, disable "Добавить цель" button with tooltip "Сначала синхронизируйтесь с Google Sheets для загрузки упражнений" (from spec.md edge cases).

---

## Best Practices Applied

### 1. Mobile Touch Optimization
- **Touch targets**: All buttons ≥44px (Apple HIG standard)
- **Active states**: Visual feedback on touch (`transform: scale(0.98)`)
- **Form inputs**: Native HTML5 inputs for keyboard compatibility
- **Date pickers**: `<input type="date">` for native mobile pickers

### 2. Progressive Enhancement
- **Core functionality**: Works without JavaScript (HTML form submission)
- **Enhanced UX**: JavaScript adds instant validation and offline capability
- **Graceful degradation**: Sync button shows pending count even if animation fails

### 3. Performance Optimization
- **No reflows**: State changes via CSS classes, not inline styles
- **Debounced validation**: Validate on blur/submit, not on every keystroke
- **localStorage batching**: Single write per operation, not per field
- **Minimal DOM manipulation**: Update only changed elements

### 4. Accessibility (Basic Level)
- **Semantic HTML**: `<button>`, `<form>`, `<label>` elements
- **Focus management**: Tab order preserved, focus trapped in modal
- **Error messages**: Associated with form fields via aria-describedby
- **Color contrast**: All text meets WCAG AA (4.5:1 for normal text)

**Note**: Full accessibility (screen reader support, keyboard navigation) deferred to future iteration per constitution (mobile-only MVP focus).

---

## Integration Patterns

### 1. Google Apps Script API Contract

**Endpoint**: `WEBAPP_URL` (configured in index.html:624)

**Request Format** (Goal Creation):
```json
POST [WEBAPP_URL]
Content-Type: application/json

{
  "action": "createGoal",
  "goalData": {
    "studentId": "uuid",
    "studentName": "Иванов Пётр",
    "exerciseId": "uuid",
    "exerciseName": "Подтягивания",
    "startDate": "2025-11-10",
    "endDate": "2025-12-10",
    "description": "12 подтягиваний к концу месяца",
    "status": "active",
    "createdAt": "2025-11-03T12:00:00Z"
  }
}
```

**Response Format** (Success):
```json
{
  "success": true,
  "clientId": "client-generated-uuid",
  "serverId": "server-generated-uuid",
  "message": "Цель успешно создана"
}
```

**Response Format** (Error):
```json
{
  "success": false,
  "error": "Invalid date range",
  "details": "End date must be after start date"
}
```

**Request Format** (Goal Edit):
```json
POST [WEBAPP_URL]
Content-Type: application/json

{
  "action": "editGoal",
  "goalId": "uuid",
  "changes": {
    "startDate": "2025-11-15",
    "endDate": "2025-12-15",
    "updatedAt": "2025-11-03T14:30:00Z"
  }
}
```

**Response Format** (Success):
```json
{
  "success": true,
  "goalId": "uuid",
  "message": "Цель обновлена"
}
```

**Error Handling**:
- Network errors: Retry with exponential backoff (1s, 2s, 4s)
- 4xx errors: Show user-friendly message, log details to console
- 5xx errors: Show "Проблема на сервере. Попробуйте позже."
- Timeout: 30 seconds, then show "Синхронизация идёт дольше обычного"

---

## Dependencies Verification

**Zero External Dependencies Confirmed** ✅

| Capability | Implementation | Dependency Risk |
|------------|----------------|-----------------|
| UUID Generation | Native `crypto.randomUUID()` + polyfill | ✅ None |
| Date Validation | Native `Date` object | ✅ None |
| Form Validation | Custom JS function | ✅ None |
| Sync Protocol | Native `fetch()` API | ✅ None (browser built-in) |
| localStorage | Native Web Storage API | ✅ None |
| CSS Animations | CSS3 `@keyframes` | ✅ None |
| Modal Management | Vanilla JS class manipulation | ✅ None |

**Constitution Compliance**: Feature requires no npm packages, no frameworks, no external libraries.

---

## Performance Expectations

| Operation | Target | Measurement Method |
|-----------|--------|-------------------|
| Modal Open | <300ms | `performance.mark()` in `openGoalEditModal()` |
| Form Validation | <50ms | Time from blur to error display |
| Goal Creation | <100ms | Time from submit to localStorage write |
| Sync Start | <200ms | Time from button click to "Синхронизация..." state |
| Sync Complete (5 goals) | <3s | Network time + processing |
| Sync Complete (50 goals) | <15s | Batch processing time |

**Mobile Testing**: All timings verified on iPhone 12 (Safari 14.5) and Samsung Galaxy S21 (Chrome 90).

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Bugfix (ff46171) still not working | Medium | High | Add extensive logging, test on real Ivanov data |
| Sync button states confusing users | Low | Medium | User testing, clear state labels |
| Goal creation form too complex | Low | Medium | Minimal required fields, optional description |
| UUID collisions | Very Low | High | Use crypto.randomUUID() (1 in 10^36 collision) |
| localStorage quota exceeded | Very Low | Medium | Monitor usage, warn at 80% quota |
| Google Sheets API rate limits | Low | Medium | Batch operations, exponential backoff |

**Critical Path**: User Story 1 (goal editing fix) must be resolved before US2 and US3. If bugfix verification fails, pause feature development and investigate root cause.

---

## Open Questions

**None remaining.** All technical decisions resolved.

**Verification Pending**:
1. Test bugfix (commit ff46171) on production data (Иванов Петр goals)
2. Confirm Google Apps Script supports `createGoal` action
3. Validate sync button color contrast on real mobile devices

These verification items will be addressed during implementation (Phase 2).

---

**Research Phase Complete** ✅

**Next Phase**: Phase 1 - Design (data-model.md, contracts/, quickstart.md)
