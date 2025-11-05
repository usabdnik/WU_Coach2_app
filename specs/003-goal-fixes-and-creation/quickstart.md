# Developer Quickstart: Goal Fixes & Creation

**Feature**: 003-goal-fixes-and-creation
**Date**: 2025-11-03
**Phase**: 1 - Design (Implementation Guide)

---

## Overview

This guide walks developers through implementing Feature 003 in the single-file PWA architecture. All code changes go into `index.html` in three sections: CSS, HTML, and JavaScript.

**Implementation Order**:
1. User Story 1 (P1): Fix goal editing bugs (verify bugfix commit ff46171)
2. User Story 2 (P2): Add visual sync feedback
3. User Story 3 (P2): Add goal creation capability

**Total Estimated Time**: 6-8 hours (2h + 2h + 3h)

---

## Prerequisites

### Before Starting

1. **Read Documentation**:
   - [ ] `specs/003-goal-fixes-and-creation/spec.md` (feature requirements)
   - [ ] `specs/003-goal-fixes-and-creation/data-model.md` (data structures)
   - [ ] `specs/003-goal-fixes-and-creation/contracts/google-apps-script-api.md` (API contract)
   - [ ] `CLAUDE.md` (project constitution and architecture)

2. **Setup Environment**:
   - [ ] Clone repository: `git clone https://github.com/usabdnik/WU_Coach2_app.git`
   - [ ] Checkout feature branch: `git checkout 003-goal-fixes-and-creation`
   - [ ] Open `index.html` in code editor
   - [ ] Open browser DevTools (Chrome or Safari)

3. **Test Data Setup**:
   - [ ] Ensure you have access to Google Sheets with test data
   - [ ] Verify "Иванов Пётр" exists with goals "Выход силой" and "передний вис"
   - [ ] Sync app once to load fresh data: click "⚡ Синхронизировать"

---

## Implementation Roadmap

### User Story 1: Fix Goal Editing (P1 - MVP) 🎯

**Goal**: Ensure all goals are clickable and open edit modal correctly.

**Time Estimate**: 2 hours (mostly testing and debugging)

#### Step 1.1: Verify Existing Bugfix (30 min)

**What to Check**:
1. **UUID Generation** (index.html:~630):
   ```javascript
   function generateUUID() {
       if (crypto.randomUUID) {
           return crypto.randomUUID();
       }
       // Polyfill exists?
   }
   ```
   ✅ **Expected**: Function exists and works on Safari <14.5

2. **Migration Function** (index.html:~814):
   ```javascript
   function migrateGoalIds() {
       // Check implementation matches spec
   }
   ```
   ✅ **Expected**: Adds UUID to goals without ID

3. **Migration Call** (index.html:~1051):
   ```javascript
   migrateAthleteFields();
   migrateGoalIds(); // This line should exist
   migrateGoalUpdatedAt();
   ```
   ✅ **Expected**: Migration runs on app load

**Testing**:
```javascript
// Open browser console
console.log('Testing UUID generation:');
console.log(generateUUID()); // Should log valid UUID

console.log('Testing migration:');
goalsData.forEach(g => {
    if (!g.id) console.error('❌ Goal missing ID:', g);
});
```

**If Tests Fail**: Add enhanced logging to `migrateGoalIds()` per research.md recommendations.

#### Step 1.2: Verify Click Handlers (30 min)

**What to Check**:
1. **Goal Card HTML** (index.html:~1252):
   ```javascript
   `<div class="goal-card ${isCompleted ? 'completed' : ''}"
        style="position: relative; cursor: pointer;"
        onclick="openGoalEditModal('${goal.id}'); event.stopPropagation();">
   ```
   ✅ **Expected**: All goal cards have `onclick` with `goal.id`

2. **Modal Function** (index.html:~1100):
   ```javascript
   function openGoalEditModal(goalId) {
       if (!goalId) {
           console.error('❌ openGoalEditModal: goalId undefined');
           return;
       }
       const goal = goalsData.find(g => g.id === goalId);
       if (!goal) {
           console.error('❌ Goal not found:', goalId);
           return;
       }
       // ... populate modal
   }
   ```
   ✅ **Expected**: Function validates `goalId` and finds goal

**Testing**:
1. Open app in browser
2. Open athlete card (e.g., "Иванов Пётр")
3. Click on goal card "Выход силой"
4. Check console for errors
5. Verify modal opens with correct dates pre-filled

**If Modal Doesn't Open**:
- Check browser console for error messages
- Add logging: `console.log('🖱️ Clicked goal:', goalId, goal);`
- Verify `goal.id` is not undefined

#### Step 1.3: Test All Goal Types (30 min)

**Test Matrix**:

| Athlete | Goal Name | Expected Result |
|---------|-----------|-----------------|
| Иванов Пётр | Выход силой | ✅ Modal opens |
| Иванов Пётр | Передний вис | ✅ Modal opens |
| Any athlete | Подтягивания | ✅ Modal opens |
| Any athlete | Отжимания от пола | ✅ Modal opens |
| Any athlete | Отжимания от брусьев | ✅ Modal opens |

**For Each Test**:
1. Click goal card
2. Verify modal opens (<300ms delay)
3. Verify dates are pre-filled correctly
4. Edit dates and save
5. Verify changes persist in localStorage
6. Reload page
7. Verify edited dates still correct

**Mobile Testing**:
- Open app on iPhone Safari or Android Chrome
- Repeat test matrix
- Verify touch targets are ≥44px
- Verify no accidental clicks on adjacent elements

#### Step 1.4: Enhanced Migration (30 min)

**Enhancement** (per research.md):

**Location**: index.html:~814 (existing `migrateGoalIds()` function)

**Add Validation Logging**:
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

**Testing**:
1. Clear localStorage: `localStorage.clear()`
2. Reload app
3. Check console for migration logs
4. Verify all goals have IDs
5. Verify warnings logged for incomplete goals

---

### User Story 2: Visual Sync Feedback (P2)

**Goal**: Clear visual indication of sync status with 4 states.

**Time Estimate**: 2 hours

#### Step 2.1: CSS Sync Button States (30 min)

**Location**: index.html:~11-524 (CSS section)

**Add After Existing Button Styles** (~line 300):

```css
/* ============================================
   Sync Button States (Feature 003 - US2)
   ============================================ */

/* Base state - Idle (gray) */
.sync-button {
    background: #2a2d3a;
    color: #ffffff;
    transition: background-color 0.3s ease, transform 0.1s ease;
    cursor: pointer;
}

/* Pending state - Has unsync'd changes (orange) */
.sync-button.pending {
    background: #fbbf24;
    color: #0f1117;
}

/* Syncing state - Operation in progress (blue, disabled) */
.sync-button.syncing {
    background: #4c9eff;
    color: #ffffff;
    cursor: not-allowed;
    pointer-events: none;
}

/* Success state - Sync completed (green, temporary) */
.sync-button.success {
    background: #4ade80;
    color: #0f1117;
}

/* Error state - Sync failed (red, temporary) */
.sync-button.error {
    background: #dc2626;
    color: #ffffff;
}

/* Spinner animation for syncing state */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.sync-button.syncing .sync-icon {
    display: inline-block;
    animation: spin 1s linear infinite;
}

/* Active feedback (touch) */
.sync-button:active:not(.syncing) {
    transform: scale(0.98);
}
```

**Testing**:
1. Add test buttons to HTML temporarily:
   ```html
   <button class="sync-button">Idle</button>
   <button class="sync-button pending">Pending</button>
   <button class="sync-button syncing">Syncing</button>
   <button class="sync-button success">Success</button>
   <button class="sync-button error">Error</button>
   ```
2. Verify colors match design system (orange=#fbbf24, green=#4ade80, red=#dc2626)
3. Verify smooth transitions (300ms)
4. Remove test buttons after verification

#### Step 2.2: Enhanced Pending Indicator (30 min)

**Location**: index.html:~1375 (existing `updatePendingIndicator()` function)

**Replace Existing Function**:

```javascript
function updatePendingIndicator() {
    const button = document.getElementById('syncButton');
    if (!button) return;

    const athleteChanges = pendingChanges.filter(c => c.type === 'athlete').length;
    const goalChanges = pendingChanges.filter(c => c.type === 'goal').length;
    const goalEditChanges = pendingChanges.filter(c => c.type === 'goal_edit').length;

    const totalChanges = pendingChanges.length;

    if (totalChanges > 0) {
        // Pending state - orange background
        button.classList.add('pending');
        button.classList.remove('syncing', 'success', 'error');

        let text = [];
        if (athleteChanges > 0) text.push(`${athleteChanges} показ.`);
        if (goalChanges > 0) text.push(`${goalChanges} цел.`);
        if (goalEditChanges > 0) text.push(`${goalEditChanges} ред.`);

        button.innerHTML = `🔄 Синхронизировать (${text.join(', ')})`;
    } else {
        // Idle state - gray background
        button.classList.remove('pending', 'syncing', 'success', 'error');
        button.innerHTML = '⚡ Синхронизировать';
    }
}
```

**Testing**:
1. Make a change (edit goal dates)
2. Verify button shows "🔄 Синхронизировать (1 ред.)"
3. Verify button has orange background (`.pending` class)
4. Make multiple changes (2 goal edits, 1 athlete edit)
5. Verify button shows "🔄 Синхронизировать (1 показ., 2 ред.)"

#### Step 2.3: Sync State Management (45 min)

**Location**: index.html:~1400 (existing `syncWithGoogleSheets()` function)

**Enhance Function**:

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
        // Coalesce changes before sync
        const coalescedChanges = coalescePendingChanges();
        console.log(`🔄 Синхронизация ${coalescedChanges.length} изменений`);

        // Process each change
        for (const change of coalescedChanges) {
            // ... existing sync logic ...

            processedChanges++;

            // Update progress for large syncs (>10 changes)
            if (totalChanges > 10) {
                button.innerHTML = `⏳ <span class="sync-icon">⏳</span> Синхронизация... (${processedChanges}/${totalChanges})`;
            }
        }

        // Success state (2 seconds)
        button.classList.remove('syncing');
        button.classList.add('success');
        button.innerHTML = '✅ Синхронизировано';
        button.disabled = false;

        setTimeout(() => {
            button.classList.remove('success');
            updatePendingIndicator(); // Return to idle/pending
        }, 2000);

        console.log(`✅ Синхронизация завершена за ${Date.now() - startTime}ms`);

    } catch (error) {
        console.error('❌ Ошибка синхронизации:', error);

        // Error state (3 seconds)
        button.classList.remove('syncing');
        button.classList.add('error');
        button.disabled = false;

        // User-friendly error messages
        let errorMsg = 'Ошибка синхронизации';
        if (error.name === 'AbortError') {
            errorMsg = 'Проверьте подключение';
        } else if (error.message.includes('NetworkError')) {
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
}
```

**Testing**:
1. Make changes → click sync → verify "⏳ Синхронизация..." with disabled state
2. Wait for completion → verify "✅ Синхронизировано" for 2 seconds → returns to idle
3. Simulate network error (DevTools offline) → verify "❌ Нет интернета" for 3 seconds
4. Test large sync (>10 changes) → verify progress counter updates

#### Step 2.4: Timeout Handling (15 min)

**Location**: Add to `syncWithGoogleSheets()` function

**Add Timeout Logic**:

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
    body: JSON.stringify(/* ... */),
    signal: controller.signal
});

clearTimeout(timeoutId); // Clear if request completes

// ... existing error handling catches AbortError
```

**Testing**:
1. Simulate slow network (DevTools throttling: Slow 3G)
2. Trigger sync
3. If >30s, verify timeout message

---

### User Story 3: Goal Creation (P2)

**Goal**: Enable creating new goals from athlete card.

**Time Estimate**: 3 hours

#### Step 3.1: HTML Modal Structure (45 min)

**Location**: index.html:~600 (after existing modals)

**Add New Modal**:

```html
<!-- Goal Creation Modal (Feature 003 - US3) -->
<div id="goalCreateModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Добавить цель</h2>
            <span class="modal-close" onclick="closeGoalCreateModal()">×</span>
        </div>
        <div class="modal-body">
            <form id="goalCreateForm" onsubmit="handleGoalCreate(event)">
                <!-- Student info (read-only, auto-filled) -->
                <input type="hidden" id="createGoalStudentId">
                <div class="form-group">
                    <label>Спортсмен</label>
                    <input type="text" id="createGoalStudentName" disabled style="background: #1a1d29; cursor: not-allowed;">
                </div>

                <!-- Exercise type dropdown -->
                <div class="form-group">
                    <label for="createGoalExercise">Тип упражнения *</label>
                    <select id="createGoalExercise" required style="background: #2a2d3a; color: #fff; padding: 12px; border-radius: 8px; border: 1px solid #3a3d4a;">
                        <option value="">Выберите упражнение</option>
                        <!-- Populated dynamically from exercisesData -->
                    </select>
                </div>

                <!-- Start date -->
                <div class="form-group">
                    <label for="createGoalStartDate">Дата начала *</label>
                    <input type="date" id="createGoalStartDate" required>
                </div>

                <!-- End date -->
                <div class="form-group">
                    <label for="createGoalEndDate">Дата окончания *</label>
                    <input type="date" id="createGoalEndDate" required>
                </div>

                <!-- Description (optional) -->
                <div class="form-group">
                    <label for="createGoalDescription">Описание (опционально)</label>
                    <textarea id="createGoalDescription"
                              placeholder="Например: 12 подтягиваний к концу месяца"
                              maxlength="200"
                              style="background: #2a2d3a; color: #fff; padding: 12px; border-radius: 8px; border: 1px solid #3a3d4a; resize: vertical; min-height: 80px;"></textarea>
                    <small style="color: #6b6f82;">Максимум 200 символов</small>
                </div>

                <!-- Error display -->
                <div id="goalCreateErrors" style="display: none; color: #dc2626; margin-bottom: 15px;"></div>

                <!-- Action buttons -->
                <div class="modal-actions">
                    <button type="button" onclick="closeGoalCreateModal()" style="background: #2a2d3a;">Отмена</button>
                    <button type="submit" id="createGoalSubmit" style="background: #4c9eff;">Создать цель</button>
                </div>
            </form>
        </div>
    </div>
</div>
```

**Testing**:
1. Add temporary button: `<button onclick="openGoalCreateModal('test-athlete-id', 'Тестовый Спортсмен')">Test Modal</button>`
2. Click button
3. Verify modal opens
4. Verify form fields render correctly
5. Verify dark theme colors

#### Step 3.2: Add "Create Goal" Button to Athlete Card (15 min)

**Location**: index.html:~1250 (in `renderAthletesList()` function, goals section)

**Find Goals Section**:
```javascript
goalsHtml += `<div class="goals-section">`;
// ... existing goal cards loop ...
goalsHtml += `</div>`;
```

**Add Button After Goals Loop**:
```javascript
goalsHtml += `<div class="goals-section">`;

// Existing goals rendering
if (athleteGoals.length > 0) {
    athleteGoals.forEach(goal => {
        // ... existing goal card HTML ...
    });
}

// NEW: Add Goal button
goalsHtml += `
    <button class="add-goal-button"
            onclick="openGoalCreateModal('${athlete.id}', '${athlete.name}'); event.stopPropagation();"
            style="width: 100%; padding: 12px; margin-top: 10px; background: #2a2d3a; color: #8b8f9f; border: 1px dashed #3a3d4a; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.2s;">
        ➕ Добавить цель
    </button>
`;

goalsHtml += `</div>`;
```

**CSS for Button Hover** (add to CSS section):
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

**Testing**:
1. Reload app
2. Open athlete card
3. Verify "➕ Добавить цель" button appears after goals list
4. Verify button has dashed border and hover effect

#### Step 3.3: JavaScript Modal Functions (60 min)

**Location**: index.html:~1100 (with other modal functions)

**Add Functions**:

```javascript
// Open goal creation modal
function openGoalCreateModal(studentId, studentName) {
    console.log('🎯 Opening goal creation modal for:', studentName);

    // Populate student info (read-only)
    document.getElementById('createGoalStudentId').value = studentId;
    document.getElementById('createGoalStudentName').value = studentName;

    // Populate exercise dropdown
    populateExerciseDropdown();

    // Reset form
    document.getElementById('goalCreateForm').reset();
    document.getElementById('createGoalStudentName').value = studentName; // Restore after reset
    document.getElementById('goalCreateErrors').style.display = 'none';

    // Set default dates (today + 30 days)
    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const futureDate = future.toISOString().split('T')[0];

    document.getElementById('createGoalStartDate').value = today;
    document.getElementById('createGoalEndDate').value = futureDate;

    // Show modal
    document.getElementById('goalCreateModal').classList.add('show');
}

// Close goal creation modal
function closeGoalCreateModal() {
    document.getElementById('goalCreateModal').classList.remove('show');
    document.getElementById('goalCreateForm').reset();
}

// Populate exercise dropdown from exercisesData
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

// Validate goal form
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

// Handle goal creation form submit
function handleGoalCreate(event) {
    event.preventDefault();

    const formData = {
        studentId: document.getElementById('createGoalStudentId').value,
        studentName: document.getElementById('createGoalStudentName').value,
        exerciseId: document.getElementById('createGoalExercise').value,
        startDate: document.getElementById('createGoalStartDate').value,
        endDate: document.getElementById('createGoalEndDate').value,
        description: document.getElementById('createGoalDescription').value.trim()
    };

    // Validate
    const validation = validateGoalForm(formData);
    if (!validation.valid) {
        const errorsDiv = document.getElementById('goalCreateErrors');
        errorsDiv.innerHTML = validation.errors.map(e => `• ${e}`).join('<br>');
        errorsDiv.style.display = 'block';
        return;
    }

    // Get exercise name
    const exercise = exercisesData.find(ex => ex.id === formData.exerciseId);
    if (!exercise) {
        alert('Ошибка: упражнение не найдено');
        return;
    }

    // Create new goal object
    const newGoal = {
        id: generateUUID(), // Client-generated UUID
        studentId: formData.studentId,
        studentName: formData.studentName,
        exerciseId: formData.exerciseId,
        exerciseName: exercise.name,
        startDate: formData.startDate,
        setDate: formData.startDate, // Dual field support
        endDate: formData.endDate,
        completionDate: formData.endDate, // Dual field support
        description: formData.description,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    console.log('✅ Создание новой цели:', newGoal);

    // Add to goalsData
    goalsData.push(newGoal);
    localStorage.setItem('goalsData', JSON.stringify(goalsData));

    // Add to pendingChanges
    pendingChanges.push({
        type: 'goal',
        action: 'create',
        goalId: newGoal.id,
        goalData: newGoal,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));

    // Update UI
    updatePendingIndicator();
    renderAthletesList();

    // Close modal
    closeGoalCreateModal();

    // Show success feedback
    alert('✅ Цель создана! Синхронизируйтесь для отправки на сервер.');
}
```

**Testing**:
1. Open athlete card → click "➕ Добавить цель"
2. Verify modal opens with pre-filled student name
3. Verify exercise dropdown populated
4. Verify default dates (today + 30 days)
5. Try submit with empty fields → verify validation errors
6. Try submit with end date < start date → verify error
7. Fill form correctly → submit → verify goal appears in list immediately
8. Verify sync button shows pending state
9. Reload page → verify goal persists
10. Sync → verify goal sent to server (check console logs)

#### Step 3.4: Server-Side Integration (30 min)

**Note**: This requires changes to Google Apps Script (not part of single-file PWA).

**Apps Script Code** (for reference, implement separately):

```javascript
// In Google Apps Script doPost(e) handler
function doPost(e) {
    const request = JSON.parse(e.postData.contents);

    if (request.action === 'createGoal') {
        return createGoal(request.goalData);
    }
    // ... existing actions ...
}

function createGoal(goalData) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Goals');
        const serverId = Utilities.getUuid();

        // Validate
        if (!goalData.studentId || !goalData.exerciseId) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'Missing required fields'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Check date logic
        const startDate = new Date(goalData.startDate);
        const endDate = new Date(goalData.endDate);
        if (endDate < startDate) {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'End date must be after start date'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Append row to Goals sheet
        sheet.appendRow([
            serverId,
            goalData.studentId,
            goalData.studentName,
            goalData.exerciseId,
            goalData.exerciseName,
            goalData.startDate,
            goalData.endDate,
            goalData.description || '',
            goalData.status || 'active',
            goalData.createdAt,
            goalData.createdAt // updatedAt same as createdAt on creation
        ]);

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            serverId: serverId,
            message: 'Цель успешно создана'
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        Logger.log('Error creating goal: ' + error);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: 'Server error: ' + error.message
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
```

**Testing Server Integration**:
1. Deploy Apps Script as Web App
2. Create goal in PWA
3. Click sync button
4. Open Google Sheets → Goals tab
5. Verify new row added with server-generated UUID
6. Verify client UUID replaced with server UUID in localStorage

---

## Testing Checklist

### Functional Testing

**User Story 1: Goal Editing**
- [ ] All goals clickable (Иванов Петр: Выход силой, передний вис)
- [ ] Modal opens <300ms
- [ ] Dates pre-filled correctly
- [ ] Edit saves to localStorage
- [ ] Reload persists changes
- [ ] Sync uploads changes to Google Sheets

**User Story 2: Sync Feedback**
- [ ] Idle state: gray button "⚡ Синхронизировать"
- [ ] Pending state: orange button with change count
- [ ] Syncing state: blue button, disabled, spinner animation
- [ ] Success state: green "✅ Синхронизировано" for 2s
- [ ] Error state: red "❌ [error message]" for 3s
- [ ] Progress counter for >10 changes
- [ ] Timeout after 30s shows appropriate message

**User Story 3: Goal Creation**
- [ ] "➕ Добавить цель" button visible in athlete card
- [ ] Modal opens with correct student name
- [ ] Exercise dropdown populated from exercisesData
- [ ] Validation prevents invalid dates
- [ ] Validation limits description to 200 chars
- [ ] Goal appears immediately after creation
- [ ] Goal persists after reload
- [ ] Sync uploads goal to Google Sheets
- [ ] Server UUID replaces client UUID

### Mobile Testing

- [ ] Test on iPhone Safari (iOS 14.5+)
- [ ] Test on Android Chrome (90+)
- [ ] Touch targets ≥44px
- [ ] Forms work with mobile keyboards
- [ ] Date pickers use native mobile UI
- [ ] No horizontal scrolling
- [ ] Modals fill screen on small devices

### Performance Testing

- [ ] Modal open <300ms (measured with `performance.mark()`)
- [ ] Form validation <50ms
- [ ] Goal creation <100ms (localStorage write)
- [ ] Sync complete (10 goals) <5s on 3G
- [ ] Page load <2s on 3G

### Edge Case Testing

- [ ] Create goal offline → go online → sync → verify success
- [ ] Edit goal 5 times → sync → verify only 1 server request (coalescing)
- [ ] Create goal with description exactly 200 chars → verify accepted
- [ ] Create goal with description 201 chars → verify rejected
- [ ] Start sync → disconnect network mid-sync → verify error handling
- [ ] Try sync while sync in progress → verify second attempt blocked

---

## Common Issues & Solutions

### Issue: Modal doesn't open on goal click

**Symptoms**: Click goal card, nothing happens, no errors in console.

**Debug Steps**:
1. Check if `goal.id` is defined: `console.log(goalsData.map(g => g.id))`
2. Verify onclick attribute: Inspect goal card HTML in DevTools
3. Check for JavaScript errors: Open console before clicking

**Solution**:
- If `goal.id` undefined: Run migration manually: `migrateGoalIds(); renderAthletesList();`
- If onclick missing: Check `renderAthletesList()` function, verify goal card HTML generation

### Issue: Sync button doesn't update pending count

**Symptoms**: Edit goal, button stays gray, no orange pending state.

**Debug Steps**:
1. Check pendingChanges array: `console.log(pendingChanges)`
2. Verify updatePendingIndicator called: Add log inside function
3. Check button ID: `document.getElementById('syncButton')`

**Solution**:
- If pendingChanges empty: Goal edit not adding to queue, check `saveGoalEdit()` function
- If button not found: Verify button has `id="syncButton"` attribute

### Issue: Form validation allows invalid dates

**Symptoms**: Can submit goal with end date before start date.

**Debug Steps**:
1. Check validation function: `validateGoalForm({ startDate: '2025-12-10', endDate: '2025-11-10' })`
2. Verify form submit handler calls validation
3. Check if validation errors displayed

**Solution**:
- If validation not called: Verify `handleGoalCreate()` function calls `validateGoalForm()`
- If errors not displayed: Check `goalCreateErrors` div exists and display logic

### Issue: Created goal doesn't sync to Google Sheets

**Symptoms**: Goal created locally, but not in Google Sheets after sync.

**Debug Steps**:
1. Check pendingChanges: Verify `type: 'goal', action: 'create'` entry exists
2. Check console logs during sync: Look for "Creating goal" message
3. Check Apps Script logs: Errors in `createGoal()` function?

**Solution**:
- If pendingChange missing: Check `handleGoalCreate()` function, verify push to pendingChanges
- If Apps Script error: Check server logs, verify `createGoal()` function exists
- If 404: Verify WEBAPP_URL is correct and Apps Script deployed

---

## Git Workflow

### Commit Strategy

**Small, Frequent Commits**:

```bash
# After completing US1
git add index.html
git commit -m "Fix: Verify goal editing bugfix (US1)

- Enhanced migrateGoalIds() with validation logging
- Added dual date field auto-fix
- Tested on Ivanov Petr goals (Vykhod siloy, Peredniy vis)
- All goals now clickable and editable

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# After completing US2
git add index.html
git commit -m "Add: Visual sync feedback with 4 states (US2)

- Idle (gray), Pending (orange), Syncing (blue), Success/Error
- Progress counter for >10 changes
- Timeout handling (30s)
- Enhanced error messages (no internet, server error, timeout)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# After completing US3
git add index.html
git commit -m "Add: Goal creation feature (US3)

- New goal creation modal with form validation
- Add Goal button in athlete cards
- Client-side UUID generation + server ID replacement
- Offline-first: create locally, sync later

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Merge to Main

```bash
# Ensure all tests pass
# Review changes
git diff main..003-goal-fixes-and-creation

# Merge to main
git checkout main
git merge 003-goal-fixes-and-creation

# Push to GitHub
git push origin main

# Verify deployment
# Open https://usabdnik.github.io/WU_Coach2_app/
# Test all features on live site
```

---

## Next Steps

After completing implementation:

1. **Run `/speckit.tasks`**: Generate detailed task breakdown
2. **Manual Testing**: Complete full testing checklist above
3. **Mobile Device Testing**: Test on real iOS and Android devices
4. **User Acceptance**: Have coach test and provide feedback
5. **Performance Monitoring**: Check console logs for timing metrics
6. **Documentation**: Update README.md with new features

---

**Quickstart Guide Complete** ✅

**Estimated Total Time**: 6-8 hours (2h US1 + 2h US2 + 3h US3 + 1-2h testing/polish)

**Next Command**: `/speckit.tasks` (generates actionable task list)
