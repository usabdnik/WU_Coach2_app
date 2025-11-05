# Implementation Tasks: Goal Fixes & Creation

**Feature**: 003-goal-fixes-and-creation
**Branch**: `003-goal-fixes-and-creation`
**Generated**: 2025-11-03

---

## Task Overview

**Total Tasks**: 26
**Estimated Time**: 6-8 hours
**Priority Order**: US1 (P1 MVP) → US2 (P2) → US3 (P2)

**Task Status Legend**:
- ⏳ **Pending**: Not started
- 🔄 **In Progress**: Currently working
- ✅ **Complete**: Done and tested
- ⚠️ **Blocked**: Waiting on dependency

---

## Phase 1: User Story 1 - Fix Goal Editing (P1 MVP) 🎯

**Objective**: Ensure all goals are clickable and editable, verify bugfix commit ff46171.

**Estimated Time**: 2 hours

**Success Criteria**:
- 100% of goals clickable (including "Выход силой" and "передний вис" for Иванов Пётр)
- Modal opens <300ms on touch
- Edits persist after reload
- No console errors

---

### Task 1.1: Verify UUID Generation Function

**Status**: ✅ Complete
**Estimated Time**: 15 minutes
**Priority**: P1 - Must complete before other tasks

**Description**: Verify `generateUUID()` function exists and works correctly with native API and polyfill fallback.

**Location**: `index.html` lines ~630-650

**Acceptance Criteria**:
- [ ] Function `generateUUID()` exists
- [ ] Uses `crypto.randomUUID()` if available
- [ ] Falls back to polyfill for Safari <14.5
- [ ] Returns valid UUID v4 format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
- [ ] Test in console: `generateUUID()` returns different UUID each call

**Testing**:
```javascript
// In browser console
console.log('UUID test:', generateUUID());
console.log('UUID format valid:', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(generateUUID()));
```

**Dependencies**: None
**Blocks**: Task 1.2, 1.3

---

### Task 1.2: Verify Migration Function Exists

**Status**: ✅ Complete
**Estimated Time**: 15 minutes
**Priority**: P1

**Description**: Verify `migrateGoalIds()` function exists and adds UUIDs to goals without ID.

**Location**: `index.html` lines ~814-828

**Acceptance Criteria**:
- [ ] Function `migrateGoalIds()` exists
- [ ] Checks `if (!goal.id)` before adding UUID
- [ ] Calls `generateUUID()` for goals without ID
- [ ] Saves to localStorage after migration
- [ ] Logs count of migrated goals

**Testing**:
```javascript
// In console
console.log('Migration test:');
const before = goalsData.filter(g => !g.id).length;
migrateGoalIds();
const after = goalsData.filter(g => !g.id).length;
console.log(`Before: ${before} without ID, After: ${after} without ID`);
```

**Dependencies**: Task 1.1
**Blocks**: Task 1.4

---

### Task 1.3: Verify Migration Call on App Load

**Status**: ✅ Complete
**Estimated Time**: 10 minutes
**Priority**: P1

**Description**: Verify `migrateGoalIds()` is called during app initialization.

**Location**: `index.html` lines ~1051 (in `initApp()` or similar)

**Acceptance Criteria**:
- [ ] Migration called after loading data from localStorage
- [ ] Called before rendering UI
- [ ] Sequence: `migrateAthleteFields()` → `migrateGoalIds()` → `migrateGoalUpdatedAt()`

**Testing**:
1. Clear localStorage: `localStorage.clear()`
2. Reload app
3. Check console for migration log: "✅ Миграция: добавлено ID для N целей"
4. Verify all goals have IDs: `goalsData.every(g => g.id)`

**Dependencies**: Task 1.2
**Blocks**: Task 1.4

---

### Task 1.4: Enhance Migration with Validation Logging

**Status**: ✅ Complete
**Estimated Time**: 30 minutes
**Priority**: P1

**Description**: Add diagnostic logging to migration function to identify goals with missing critical fields.

**Location**: `index.html` lines ~814-828 (enhance existing function)

**Code Changes**:
```javascript
function migrateGoalIds() {
    let migrated = 0;
    let warnings = [];

    goalsData.forEach((goal, index) => {
        // Existing: Add UUID if missing
        if (!goal.id) {
            goal.id = generateUUID();
            migrated++;
            console.log(`🔧 Миграция: добавлен ID для цели ${index}: ${goal.exerciseName} (${goal.studentName})`);
        }

        // NEW: Warn about missing fields
        if (!goal.exerciseName) {
            warnings.push(`⚠️ Цель ${goal.id}: отсутствует exerciseName`);
        }
        if (!goal.studentName) {
            warnings.push(`⚠️ Цель ${goal.id}: отсутствует studentName`);
        }

        // NEW: Auto-fix dual date fields
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

**Acceptance Criteria**:
- [ ] Logs each migrated goal with index, exerciseName, studentName
- [ ] Warns about missing exerciseName or studentName
- [ ] Auto-fixes dual date fields (startDate/setDate, endDate/completionDate)
- [ ] Returns object with migrated count and warnings count

**Testing**:
1. Manually remove ID from one goal: `goalsData[0].id = undefined`
2. Run migration: `migrateGoalIds()`
3. Verify console log shows goal details
4. Verify goal now has ID

**Dependencies**: Task 1.1, 1.2, 1.3
**Blocks**: None (enhancement)

---

### Task 1.5: Verify Goal Card Click Handlers

**Status**: ✅ Complete
**Estimated Time**: 20 minutes
**Priority**: P1

**Description**: Verify all goal cards have onclick handlers with valid goal.id parameter.

**Location**: `index.html` lines ~1252 (in `renderAthletesList()` function)

**Acceptance Criteria**:
- [ ] Goal card HTML includes `onclick="openGoalEditModal('${goal.id}')"`
- [ ] `${goal.id}` is not undefined (check with console.log)
- [ ] `event.stopPropagation()` prevents card click from bubbling
- [ ] Cursor shows pointer on hover

**Testing**:
1. Open browser DevTools
2. Inspect goal card element
3. Verify onclick attribute exists and has valid UUID
4. Click goal card
5. Verify modal opens

**Dependencies**: Task 1.4
**Blocks**: Task 1.6

---

### Task 1.6: Verify Modal Function Validates goalId

**Status**: ✅ Complete
**Estimated Time**: 20 minutes
**Priority**: P1

**Description**: Verify `openGoalEditModal()` function validates goalId and finds goal in goalsData.

**Location**: `index.html` lines ~1100

**Acceptance Criteria**:
- [ ] Function checks `if (!goalId)` and logs error
- [ ] Function finds goal: `goalsData.find(g => g.id === goalId)`
- [ ] Function checks `if (!goal)` and logs error
- [ ] Modal populated with goal dates
- [ ] Modal displays correctly

**Testing**:
```javascript
// Test invalid ID
openGoalEditModal(); // Should log error: "goalId undefined"
openGoalEditModal('invalid-uuid'); // Should log error: "Goal not found"

// Test valid ID
const validGoalId = goalsData[0].id;
openGoalEditModal(validGoalId); // Should open modal
```

**Dependencies**: Task 1.5
**Blocks**: Task 1.7

---

### Task 1.7: Test All Goal Types for Clickability

**Status**: ⏳ Pending
**Estimated Time**: 30 minutes
**Priority**: P1 - Critical test

**Description**: Manually test all goal types to ensure modal opens correctly.

**Test Matrix**:

| Test # | Athlete | Goal Exercise | Expected Result |
|--------|---------|---------------|-----------------|
| 1 | Иванов Пётр | Выход силой | ✅ Modal opens |
| 2 | Иванов Пётр | Передний вис | ✅ Modal opens |
| 3 | Any athlete | Подтягивания | ✅ Modal opens |
| 4 | Any athlete | Отжимания от пола | ✅ Modal opens |
| 5 | Any athlete | Отжимания от брусьев | ✅ Modal opens |

**For Each Test**:
1. Open athlete card
2. Click goal card
3. Verify modal opens <300ms
4. Verify dates pre-filled
5. Change dates
6. Click "Сохранить"
7. Verify changes persist
8. Reload page
9. Verify changes still present

**Acceptance Criteria**:
- [ ] All 5 test cases pass
- [ ] No console errors
- [ ] Modal opens <300ms (measured subjectively or with Performance API)
- [ ] Edited dates persist after reload

**Dependencies**: Task 1.6
**Blocks**: None

---

### Task 1.8: Mobile Device Testing for Goal Editing

**Status**: ⏳ Pending
**Estimated Time**: 20 minutes
**Priority**: P1

**Description**: Test goal editing on real mobile devices.

**Test Devices**:
- iPhone (Safari 14.5+)
- Android phone (Chrome 90+)

**Test Steps**:
1. Open app on mobile device
2. Open athlete card
3. Tap goal "Выход силой"
4. Verify modal opens
5. Verify touch targets ≥44px
6. Edit dates using mobile date picker
7. Save and verify changes persist

**Acceptance Criteria**:
- [ ] Modal opens on tap (no double-tap required)
- [ ] Touch targets comfortable (≥44px)
- [ ] Native date picker appears
- [ ] No horizontal scrolling
- [ ] Changes save correctly

**Dependencies**: Task 1.7
**Blocks**: None

---

## Phase 2: User Story 2 - Visual Sync Feedback (P2)

**Objective**: Add 4-state visual feedback for sync button.

**Estimated Time**: 2 hours

**Success Criteria**:
- Sync button shows 4 distinct states (idle/pending/syncing/complete)
- Progress counter for >10 changes
- Error messages user-friendly (in Russian, no technical jargon)
- Timeout handling after 30 seconds

---

### Task 2.1: Add CSS Sync Button States

**Status**: ✅ Complete
**Estimated Time**: 20 minutes
**Priority**: P2

**Description**: Add CSS classes for 4 sync button states with smooth transitions.

**Location**: `index.html` lines ~300 (CSS section, after existing button styles)

**Code to Add**:
```css
/* Sync Button States (Feature 003 - US2) */
.sync-button {
    background: #2a2d3a;
    color: #ffffff;
    transition: background-color 0.3s ease, transform 0.1s ease;
    cursor: pointer;
}

.sync-button.pending {
    background: #fbbf24;
    color: #0f1117;
}

.sync-button.syncing {
    background: #4c9eff;
    color: #ffffff;
    cursor: not-allowed;
    pointer-events: none;
}

.sync-button.success {
    background: #4ade80;
    color: #0f1117;
}

.sync-button.error {
    background: #dc2626;
    color: #ffffff;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.sync-button.syncing .sync-icon {
    display: inline-block;
    animation: spin 1s linear infinite;
}

.sync-button:active:not(.syncing) {
    transform: scale(0.98);
}
```

**Acceptance Criteria**:
- [ ] 5 CSS classes defined (base, pending, syncing, success, error)
- [ ] Colors match design system (orange=#fbbf24, green=#4ade80, red=#dc2626, blue=#4c9eff)
- [ ] Smooth transition (0.3s ease)
- [ ] Spinner animation defined
- [ ] Active state transform (scale 0.98)

**Testing**: Create temporary test buttons with each class, verify colors and transitions.

**Dependencies**: None
**Blocks**: Task 2.2, 2.3

---

### Task 2.2: Enhance updatePendingIndicator Function

**Status**: ✅ Complete
**Estimated Time**: 30 minutes
**Priority**: P2

**Description**: Modify `updatePendingIndicator()` to show pending state with change count breakdown.

**Location**: `index.html` lines ~1375

**Code Changes**:
```javascript
function updatePendingIndicator() {
    const button = document.getElementById('syncButton');
    if (!button) return;

    const athleteChanges = pendingChanges.filter(c => c.type === 'athlete').length;
    const goalChanges = pendingChanges.filter(c => c.type === 'goal').length;
    const goalEditChanges = pendingChanges.filter(c => c.type === 'goal_edit').length;

    const totalChanges = pendingChanges.length;

    if (totalChanges > 0) {
        button.classList.add('pending');
        button.classList.remove('syncing', 'success', 'error');

        let text = [];
        if (athleteChanges > 0) text.push(`${athleteChanges} показ.`);
        if (goalChanges > 0) text.push(`${goalChanges} цел.`);
        if (goalEditChanges > 0) text.push(`${goalEditChanges} ред.`);

        button.innerHTML = `🔄 Синхронизировать (${text.join(', ')})`;
    } else {
        button.classList.remove('pending', 'syncing', 'success', 'error');
        button.innerHTML = '⚡ Синхронизировать';
    }
}
```

**Acceptance Criteria**:
- [ ] Function counts athlete, goal, and goal_edit changes separately
- [ ] Pending state shows orange background
- [ ] Text shows breakdown (e.g., "🔄 Синхронизировать (1 показ., 2 ред.)")
- [ ] Idle state shows gray background with "⚡ Синхронизировать"

**Testing**:
1. Make 1 athlete edit → verify "🔄 Синхронизировать (1 показ.)"
2. Make 2 goal edits → verify "🔄 Синхронизировать (2 ред.)"
3. Make both → verify "🔄 Синхронизировать (1 показ., 2 ред.)"

**Dependencies**: Task 2.1
**Blocks**: Task 2.3

---

### Task 2.3: Add Syncing State to syncWithGoogleSheets

**Status**: ✅ Complete
**Estimated Time**: 45 minutes
**Priority**: P2

**Description**: Enhance `syncWithGoogleSheets()` function with syncing state management.

**Location**: `index.html` lines ~1400

**Code Changes**:
Add at start of function:
```javascript
async function syncWithGoogleSheets() {
    const button = document.getElementById('syncButton');

    // Prevent multiple simultaneous syncs
    if (button.classList.contains('syncing')) {
        console.log('⏳ Синхронизация уже идёт, пропускаем');
        return;
    }

    // Start syncing state
    button.classList.add('syncing');
    button.classList.remove('pending', 'success', 'error');
    button.disabled = true;
    button.innerHTML = '⏳ <span class="sync-icon">⏳</span> Синхронизация...';

    const startTime = Date.now();
    const totalChanges = pendingChanges.length;
    let processedChanges = 0;

    try {
        // ... existing sync logic ...

        // After each change processed:
        processedChanges++;
        if (totalChanges > 10) {
            button.innerHTML = `⏳ <span class="sync-icon">⏳</span> Синхронизация... (${processedChanges}/${totalChanges})`;
        }

        // ... rest of sync logic ...
    }
}
```

**Acceptance Criteria**:
- [ ] Button enters syncing state at start (blue background, disabled)
- [ ] Progress counter shows for >10 changes
- [ ] Prevents concurrent syncs (check if already syncing)
- [ ] Spinner icon animates

**Testing**:
1. Make 5 changes → sync → verify no progress counter
2. Make 15 changes → sync → verify progress counter updates
3. Click sync while syncing → verify second click ignored

**Dependencies**: Task 2.2
**Blocks**: Task 2.4, 2.5

---

### Task 2.4: Add Success State after Sync

**Status**: ✅ Complete
**Estimated Time**: 15 minutes
**Priority**: P2

**Description**: Show green success state for 2 seconds after successful sync.

**Location**: `index.html` in `syncWithGoogleSheets()` function (end of try block)

**Code to Add**:
```javascript
// At end of try block, after sync completes
button.classList.remove('syncing');
button.classList.add('success');
button.innerHTML = '✅ Синхронизировано';
button.disabled = false;

setTimeout(() => {
    button.classList.remove('success');
    updatePendingIndicator(); // Return to idle/pending
}, 2000);

console.log(`✅ Синхронизация завершена за ${Date.now() - startTime}ms`);
```

**Acceptance Criteria**:
- [ ] Button shows green background for 2 seconds
- [ ] Text shows "✅ Синхронизировано"
- [ ] After 2s, returns to idle state (gray)
- [ ] Button re-enabled after success

**Testing**:
1. Sync successfully
2. Verify green state appears
3. Wait 2 seconds
4. Verify button returns to gray idle state

**Dependencies**: Task 2.3
**Blocks**: None

---

### Task 2.5: Add Error State after Sync Failure

**Status**: ✅ Complete
**Estimated Time**: 30 minutes
**Priority**: P2

**Description**: Show red error state for 3 seconds after sync failure with user-friendly messages.

**Location**: `index.html` in `syncWithGoogleSheets()` function (catch block)

**Code to Add**:
```javascript
catch (error) {
    console.error('❌ Ошибка синхронизации:', error);

    button.classList.remove('syncing');
    button.classList.add('error');
    button.disabled = false;

    // User-friendly error messages
    let errorMsg = 'Ошибка синхронизации';
    if (error.name === 'AbortError') {
        errorMsg = 'Проверьте подключение';
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMsg = 'Нет интернета';
    } else if (error.message.includes('500')) {
        errorMsg = 'Проблема на сервере';
    }

    button.innerHTML = `❌ ${errorMsg}`;

    setTimeout(() => {
        button.classList.remove('error');
        updatePendingIndicator(); // Return to pending state
    }, 3000);
}
```

**Acceptance Criteria**:
- [ ] Button shows red background for 3 seconds
- [ ] Error messages in Russian (no "NetworkError", "500", etc.)
- [ ] Different messages for different error types
- [ ] After 3s, returns to pending state (changes still queued)
- [ ] Button re-enabled after error

**Testing**:
1. Go offline (DevTools Network: Offline)
2. Try sync
3. Verify "❌ Нет интернета" shows for 3s
4. Go online, sync again
5. Verify success

**Dependencies**: Task 2.3
**Blocks**: Task 2.6

---

### Task 2.6: Add Timeout Handling

**Status**: ✅ Complete
**Estimated Time**: 20 minutes
**Priority**: P2

**Description**: Add 30-second timeout for sync operations.

**Location**: `index.html` in `syncWithGoogleSheets()` function

**Code to Add**:
```javascript
// At start of syncWithGoogleSheets()
const controller = new AbortController();
const timeoutId = setTimeout(() => {
    controller.abort();
}, 30000); // 30 second timeout

// In fetch calls
const response = await fetch(WEBAPP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
    signal: controller.signal
});

clearTimeout(timeoutId); // Clear if request completes
```

**Acceptance Criteria**:
- [ ] Timeout set to 30 seconds
- [ ] AbortController signal passed to fetch
- [ ] Timeout cleared on successful request
- [ ] Timeout error caught in catch block (error.name === 'AbortError')
- [ ] Error message "Проверьте подключение" shown

**Testing**:
1. Use DevTools Network throttling: Slow 3G
2. Trigger sync
3. If takes >30s, verify timeout triggers
4. Verify error message shows

**Dependencies**: Task 2.5
**Blocks**: None

---

## Phase 3: User Story 3 - Goal Creation (P2)

**Objective**: Enable creating new goals with modal form and offline-first sync.

**Estimated Time**: 3 hours

**Success Criteria**:
- "➕ Добавить цель" button in athlete cards
- Modal form with validation
- Goal appears immediately after creation
- Offline creation works (localStorage → sync later)
- Server UUID replaces client UUID after sync

---

### Task 3.1: Add Goal Creation Modal HTML

**Status**: ✅ Complete
**Estimated Time**: 30 minutes
**Priority**: P2

**Description**: Add new modal structure for goal creation form.

**Location**: `index.html` lines ~600 (after existing modals, before closing body tag)

**Code to Add**: Full modal HTML with form fields (exercise dropdown, dates, description).

**See quickstart.md Step 3.1 for complete HTML structure.**

**Acceptance Criteria**:
- [ ] Modal div with id="goalCreateModal"
- [ ] Form with id="goalCreateForm"
- [ ] Hidden input for studentId
- [ ] Disabled input for studentName (read-only)
- [ ] Select dropdown for exercise (id="createGoalExercise")
- [ ] Date inputs for startDate and endDate (type="date")
- [ ] Textarea for description (maxlength="200")
- [ ] Error div (id="goalCreateErrors", initially hidden)
- [ ] Cancel and Submit buttons

**Testing**: Open modal temporarily with test function, verify all fields render.

**Dependencies**: None
**Blocks**: Task 3.2, 3.3

---

### Task 3.2: Add "Create Goal" Button to Athlete Cards

**Status**: ✅ Complete
**Estimated Time**: 15 minutes
**Priority**: P2

**Description**: Add "➕ Добавить цель" button at end of goals section in athlete card.

**Location**: `index.html` lines ~1250 (in `renderAthletesList()` function, goals section)

**Code to Add**:
```javascript
// After existing goals loop, before closing goals-section div
goalsHtml += `
    <button class="add-goal-button"
            onclick="openGoalCreateModal('${athlete.id}', '${athlete.name}'); event.stopPropagation();"
            style="width: 100%; padding: 12px; margin-top: 10px; background: #2a2d3a; color: #8b8f9f; border: 1px dashed #3a3d4a; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.2s;">
        ➕ Добавить цель
    </button>
`;
```

**CSS to Add**:
```css
.add-goal-button:hover {
    background: #3a3d4a;
    color: #ffffff;
    border-color: #4c9eff;
}

.add-goal-button:active {
    transform: scale(0.98);
}
```

**Acceptance Criteria**:
- [ ] Button appears after goals list in every athlete card
- [ ] Button has dashed border (visual distinction from solid buttons)
- [ ] Hover state changes background and border color
- [ ] Click opens modal with correct athlete info

**Testing**:
1. Open any athlete card
2. Verify "➕ Добавить цель" button visible
3. Hover → verify color change
4. Click → verify modal opens (will test in next task)

**Dependencies**: Task 3.1
**Blocks**: Task 3.3

---

### Task 3.3: Add openGoalCreateModal Function

**Status**: ✅ Complete
**Estimated Time**: 30 minutes
**Priority**: P2

**Description**: JavaScript function to open modal and populate student info.

**Location**: `index.html` lines ~1100 (with other modal functions)

**Code to Add**:
```javascript
function openGoalCreateModal(studentId, studentName) {
    console.log('🎯 Opening goal creation modal for:', studentName);

    document.getElementById('createGoalStudentId').value = studentId;
    document.getElementById('createGoalStudentName').value = studentName;

    populateExerciseDropdown();

    document.getElementById('goalCreateForm').reset();
    document.getElementById('createGoalStudentName').value = studentName;
    document.getElementById('goalCreateErrors').style.display = 'none';

    // Set default dates (today + 30 days)
    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const futureDate = future.toISOString().split('T')[0];

    document.getElementById('createGoalStartDate').value = today;
    document.getElementById('createGoalEndDate').value = futureDate;

    document.getElementById('goalCreateModal').classList.add('show');
}

function closeGoalCreateModal() {
    document.getElementById('goalCreateModal').classList.remove('show');
    document.getElementById('goalCreateForm').reset();
}
```

**Acceptance Criteria**:
- [ ] Function accepts studentId and studentName parameters
- [ ] Student name pre-filled in disabled field
- [ ] StudentId stored in hidden field
- [ ] Default dates set (today and 30 days from now)
- [ ] Modal shown with .show class
- [ ] Close function removes .show class and resets form

**Testing**:
1. Call `openGoalCreateModal('test-id', 'Test Student')`
2. Verify modal opens
3. Verify student name shown
4. Verify dates defaulted
5. Click close (×) → verify modal closes

**Dependencies**: Task 3.1, 3.2
**Blocks**: Task 3.4

---

### Task 3.4: Add populateExerciseDropdown Function

**Status**: ✅ Complete
**Estimated Time**: 20 minutes
**Priority**: P2

**Description**: Populate exercise dropdown from exercisesData array.

**Location**: `index.html` with other modal functions

**Code to Add**:
```javascript
function populateExerciseDropdown() {
    const select = document.getElementById('createGoalExercise');
    select.innerHTML = '<option value="">Выберите упражнение</option>';

    if (exercisesData.length === 0) {
        select.innerHTML += '<option value="" disabled>Сначала синхронизируйтесь</option>';
        select.disabled = true;
        document.getElementById('createGoalSubmit').disabled = true;
        return;
    }

    exercisesData.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise.id;
        option.textContent = exercise.name;
        select.appendChild(option);
    });

    select.disabled = false;
    document.getElementById('createGoalSubmit').disabled = false;
}
```

**Acceptance Criteria**:
- [ ] Dropdown populated from exercisesData
- [ ] Each option has exercise.id as value and exercise.name as text
- [ ] If exercisesData empty, show "Сначала синхронизируйтесь" and disable submit
- [ ] Placeholder option "Выберите упражнение" at top

**Testing**:
1. Ensure exercisesData loaded (sync first if needed)
2. Open goal creation modal
3. Verify dropdown has 5+ exercise options
4. Clear exercisesData: `exercisesData = []`
5. Open modal again
6. Verify dropdown disabled with sync message

**Dependencies**: Task 3.3
**Blocks**: Task 3.5

---

### Task 3.5: Add validateGoalForm Function

**Status**: ✅ Complete
**Estimated Time**: 30 minutes
**Priority**: P2

**Description**: Client-side form validation for goal creation.

**Location**: `index.html` with other form functions

**Code to Add**:
```javascript
function validateGoalForm(formData) {
    const errors = [];

    if (!formData.exerciseId) errors.push('Выберите тип упражнения');
    if (!formData.startDate) errors.push('Укажите дату начала');
    if (!formData.endDate) errors.push('Укажите дату окончания');

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

    if (formData.description && formData.description.length > 200) {
        errors.push('Описание не может превышать 200 символов');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}
```

**Acceptance Criteria**:
- [ ] Validates required fields (exerciseId, startDate, endDate)
- [ ] Validates endDate >= startDate
- [ ] Validates duration <= 365 days
- [ ] Validates description <= 200 characters
- [ ] Returns object with valid boolean and errors array

**Testing**:
```javascript
// Test in console
validateGoalForm({ exerciseId: '', startDate: '', endDate: '' });
// Should return: { valid: false, errors: ['Выберите тип упражнения', ...] }

validateGoalForm({
    exerciseId: 'id',
    startDate: '2025-12-10',
    endDate: '2025-11-10'
});
// Should return: { valid: false, errors: ['Дата окончания должна быть позже...'] }
```

**Dependencies**: None (standalone function)
**Blocks**: Task 3.6

---

### Task 3.6: Add handleGoalCreate Function

**Status**: ✅ Complete
**Estimated Time**: 45 minutes
**Priority**: P2

**Description**: Handle form submission, validate, create goal, save to localStorage and pendingChanges.

**Location**: `index.html` with other form handlers

**Code to Add**: See quickstart.md Step 3.3 for complete function (handleGoalCreate).

**Key Logic**:
1. Prevent default form submission
2. Gather form data
3. Validate using validateGoalForm()
4. If invalid, display errors
5. If valid, create goal object with client UUID
6. Add to goalsData and localStorage
7. Add to pendingChanges (type: 'goal', action: 'create')
8. Update UI (renderAthletesList, updatePendingIndicator)
9. Close modal
10. Show success feedback

**Acceptance Criteria**:
- [ ] Form submission prevented (no page reload)
- [ ] Validation called and errors displayed if invalid
- [ ] New goal object created with all required fields
- [ ] Client UUID generated with generateUUID()
- [ ] Goal added to goalsData array
- [ ] Goal saved to localStorage
- [ ] PendingChange created with type='goal', action='create'
- [ ] UI updates immediately (goal visible in list)
- [ ] Modal closes after successful creation
- [ ] Success message shown (alert or console log)

**Testing**:
1. Open modal → submit empty form → verify errors shown
2. Fill form with invalid dates → verify error
3. Fill form correctly → submit
4. Verify goal appears in athlete card immediately
5. Check localStorage: `JSON.parse(localStorage.goalsData)`
6. Check pendingChanges: `JSON.parse(localStorage.pendingChanges)`
7. Verify sync button shows pending state

**Dependencies**: Task 3.5
**Blocks**: Task 3.7

---

### Task 3.7: Test Goal Creation Flow End-to-End

**Status**: ⏳ Pending
**Estimated Time**: 30 minutes
**Priority**: P2

**Description**: Full end-to-end test of goal creation from button click to sync.

**Test Steps**:
1. Open athlete card
2. Click "➕ Добавить цель"
3. Verify modal opens with student name
4. Select exercise "Подтягивания"
5. Set dates (start: today, end: 30 days from now)
6. Add description "10 подтягиваний"
7. Submit form
8. Verify goal appears in list immediately
9. Reload page
10. Verify goal still present (localStorage persistence)
11. Click sync button
12. Wait for sync complete
13. Open Google Sheets → Goals tab
14. Verify new goal row added
15. Check localStorage: verify client UUID replaced with server UUID

**Acceptance Criteria**:
- [ ] Goal created and visible immediately
- [ ] Goal persists after reload
- [ ] Sync sends goal to server
- [ ] Server returns serverId
- [ ] Client UUID replaced with server UUID in localStorage
- [ ] No errors in console

**Dependencies**: Task 3.6
**Blocks**: Task 3.8

---

### Task 3.8: Test Offline Goal Creation

**Status**: ⏳ Pending
**Estimated Time**: 15 minutes
**Priority**: P2

**Description**: Test goal creation while offline, then sync when back online.

**Test Steps**:
1. Go offline (DevTools Network: Offline)
2. Create new goal
3. Verify goal appears in list
4. Verify sync button shows pending state
5. Try to sync → verify error "Нет интернета"
6. Go back online
7. Sync again
8. Verify success
9. Check Google Sheets for new goal

**Acceptance Criteria**:
- [ ] Goal created while offline
- [ ] Goal stored in localStorage
- [ ] PendingChange stored in localStorage
- [ ] Sync fails gracefully with error message
- [ ] After going online, sync succeeds
- [ ] Goal uploaded to Google Sheets
- [ ] UUID replaced correctly

**Dependencies**: Task 3.7
**Blocks**: None

---

### Task 3.9: Mobile Testing for Goal Creation

**Status**: ⏳ Pending
**Estimated Time**: 20 minutes
**Priority**: P2

**Description**: Test goal creation flow on mobile devices.

**Test Devices**:
- iPhone (Safari 14.5+)
- Android (Chrome 90+)

**Test Steps**:
1. Open app on mobile
2. Open athlete card
3. Tap "➕ Добавить цель"
4. Verify modal fills screen
5. Select exercise from dropdown
6. Tap date fields → verify native date picker appears
7. Fill description
8. Submit
9. Verify goal appears
10. Test offline creation on mobile

**Acceptance Criteria**:
- [ ] Button easy to tap (≥44px)
- [ ] Modal comfortable on small screen
- [ ] Native date pickers work
- [ ] No horizontal scrolling
- [ ] Keyboard doesn't obscure fields
- [ ] All functionality works offline

**Dependencies**: Task 3.8
**Blocks**: None

---

## Phase 4: Integration & Polish

**Objective**: Final testing, bug fixes, and code polish.

**Estimated Time**: 1 hour

---

### Task 4.1: Cross-Feature Integration Test

**Status**: ⏳ Pending
**Estimated Time**: 20 minutes
**Priority**: P2

**Description**: Test all 3 user stories together to ensure no conflicts.

**Test Scenario**:
1. Create new goal (US3)
2. Edit existing goal (US1)
3. Sync both changes (US2)
4. Verify both synced correctly

**Acceptance Criteria**:
- [ ] Can create and edit goals in same session
- [ ] Sync handles multiple change types correctly
- [ ] No JavaScript errors
- [ ] All changes persist

**Dependencies**: All previous tasks
**Blocks**: Task 4.2

---

### Task 4.2: Performance Verification

**Status**: ⏳ Pending
**Estimated Time**: 15 minutes
**Priority**: P3 (nice to have)

**Description**: Verify performance targets met.

**Metrics to Check**:
- Modal open time <300ms
- Form validation <50ms
- Goal creation <100ms
- Sync (10 goals) <5s on 3G

**Testing**: Use Performance API or DevTools Performance tab to measure.

**Acceptance Criteria**:
- [ ] All metrics within targets
- [ ] If not, log warnings but don't block

**Dependencies**: Task 4.1
**Blocks**: None

---

### Task 4.3: Code Cleanup

**Status**: ⏳ Pending
**Estimated Time**: 15 minutes
**Priority**: P3

**Description**: Clean up console.logs, remove test code, verify code style.

**Checklist**:
- [ ] Remove debug console.logs (keep important ones with emoji)
- [ ] Remove any temporary test buttons/functions
- [ ] Verify consistent indentation
- [ ] Check for TODO comments (resolve or remove)
- [ ] Verify all functions have descriptive names

**Dependencies**: Task 4.2
**Blocks**: Task 4.4

---

### Task 4.4: Final Manual Testing Checklist

**Status**: ⏳ Pending
**Estimated Time**: 20 minutes
**Priority**: P1

**Description**: Run through complete testing checklist from quickstart.md.

**Test All**:
- [ ] US1: Goal editing (5 goal types)
- [ ] US2: Sync feedback (4 states)
- [ ] US3: Goal creation (offline/online)
- [ ] Mobile testing (iPhone + Android)
- [ ] Edge cases (error handling, validation)

**Acceptance Criteria**:
- [ ] All checklist items pass
- [ ] No critical bugs found
- [ ] Ready for commit

**Dependencies**: Task 4.3
**Blocks**: Task 4.5

---

### Task 4.5: Git Commit & Documentation

**Status**: ⏳ Pending
**Estimated Time**: 10 minutes
**Priority**: P1

**Description**: Commit all changes with descriptive message, update documentation.

**Steps**:
1. Review all changes: `git diff`
2. Stage changes: `git add index.html`
3. Commit with message (see quickstart.md for format)
4. Push to branch: `git push origin 003-goal-fixes-and-creation`
5. Update README.md if needed

**Commit Message Template**:
```
Feature 003: Goal Fixes & Creation

- US1 (P1): Fixed goal editing for all goal types
- US2 (P2): Added 4-state visual sync feedback
- US3 (P2): Enabled goal creation with offline support

Tested on iOS Safari and Android Chrome.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Acceptance Criteria**:
- [ ] Commit includes only index.html changes (no spec files)
- [ ] Commit message descriptive
- [ ] Pushed to feature branch
- [ ] README updated if needed

**Dependencies**: Task 4.4
**Blocks**: None - **FEATURE COMPLETE** 🎉

---

## Summary

**Total Tasks**: 26
**Estimated Total Time**: 6-8 hours

**Breakdown by Phase**:
- Phase 1 (US1): 8 tasks, 2 hours
- Phase 2 (US2): 6 tasks, 2 hours
- Phase 3 (US3): 9 tasks, 3 hours
- Phase 4 (Polish): 5 tasks, 1 hour

**Next Step**: Start with Task 1.1 (Verify UUID Generation Function)

**Implementation Order**: Must follow task dependencies (complete blocking tasks before dependent tasks).

---

**Ready for Implementation** ✅

Run `/speckit.implement` to begin executing these tasks systematically.
